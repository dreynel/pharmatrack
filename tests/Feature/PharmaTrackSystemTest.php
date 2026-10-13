<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Category;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PharmaTrackSystemTest extends TestCase
{
    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get('/');
        $response->assertRedirect('/login');
    }

    public function test_login_page_loads_successfully(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertSee('Sign In to System');
    }

    public function test_login_authentication_success(): void
    {
        $response = $this->postJson('/login', [
            'login'    => 'admin@pharmatrack.com',
            'password' => 'admin123'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertAuthenticated();
    }

    public function test_login_authentication_failure(): void
    {
        $response = $this->postJson('/login', [
            'login'    => 'admin@pharmatrack.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertStatus(422);
        $response->assertJson(['success' => false]);
        $this->assertGuest();
    }

    public function test_homepage_loads_for_authenticated_user(): void
    {
        $user = \App\Models\User::first();
        $response = $this->actingAs($user)->get('/');
        $response->assertStatus(200);
        $response->assertSee('PharmaTrack');
    }

    public function test_dashboard_stats_endpoint(): void
    {
        $response = $this->getJson('/api/dashboard/stats');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'today_sales',
            'critical_stock_count',
            'expiring_soon_count',
            'monthly_revenue',
            'total_skus',
            'total_valuation',
            'recent_sales',
            'critical_items',
            'sales_chart' => [
                'labels',
                'data'
            ]
        ]);
    }

    public function test_products_list_endpoint(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
        $this->assertGreaterThan(0, count($response->json()));
    }

    public function test_pos_checkout_flow(): void
    {
        $product = Product::where('stock', '>', 5)->first();
        $this->assertNotNull($product, 'Need at least one product with stock > 5');

        $initialStock = $product->stock;
        $qtyToBuy = 2;

        $payload = [
            'cashier' => 'Test Cashier',
            'payment_method' => 'Cash',
            'tendered' => 500,
            'discount' => 0,
            'items' => [
                [
                    'product_id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'price' => $product->price,
                    'qty' => $qtyToBuy
                ]
            ]
        ];

        $response = $this->postJson('/api/pos/checkout', $payload);
        $response->assertStatus(201);
        $response->assertJson([
            'success' => true
        ]);

        $freshProduct = $product->fresh();
        $this->assertEquals($initialStock - $qtyToBuy, $freshProduct->stock);
    }

    public function test_stock_in_receiving_flow(): void
    {
        $product = Product::first();
        $initialStock = $product->stock;
        $addQty = 15;

        $payload = [
            'supplier_name' => 'Unilab Distribution Inc.',
            'reference_no' => 'TEST-REC-'.time(),
            'received_by' => 'Pharmacist Test',
            'notes' => 'Automated receiving test',
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => $addQty,
                    'unit_cost' => $product->cost_price ?: 10.00,
                    'batch_no' => 'BAT-TEST-01',
                    'expiry_date' => now()->addYear()->format('Y-m-d')
                ]
            ]
        ];

        $response = $this->postJson('/api/stock-in', $payload);
        $response->assertStatus(201);
        $response->assertJson(['success' => true]);

        $this->assertEquals($initialStock + $addQty, $product->fresh()->stock);
    }

    public function test_stock_out_disposal_flow(): void
    {
        $product = Product::where('stock', '>=', 5)->first();
        $initialStock = $product->stock;
        $disposeQty = 2;

        $payload = [
            'reason' => 'Damaged Goods during inspection',
            'authorized_by' => 'QA Officer',
            'remarks' => 'Seal broken on inspection',
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => $disposeQty,
                    'unit_cost' => $product->cost_price ?: 10.00
                ]
            ]
        ];

        $response = $this->postJson('/api/stock-out', $payload);
        $response->assertStatus(201);
        $response->assertJson(['success' => true]);

        $this->assertEquals($initialStock - $disposeQty, $product->fresh()->stock);
    }

    public function test_uom_conversion_breakdown_flow(): void
    {
        // Find or create a box/pack product that can be broken down
        $box = Product::where('uom', 'like', '%Box%')->where('stock', '>=', 1)->first();
        $unit = Product::where('uom', 'Tablet')->orWhere('uom', 'Capsule')->first();

        if ($box && $unit) {
            $initialBoxStock = $box->stock;
            $initialUnitStock = $unit->stock;
            $multiplier = 10;

            $payload = [
                'source_product_id' => $box->id,
                'target_product_id' => $unit->id,
                'source_qty' => 1,
                'target_qty' => $multiplier,
                'notes' => 'Breakdown 1 box into 10 units test'
            ];

            $response = $this->postJson('/api/conversions', $payload);
            $response->assertStatus(201);
            $response->assertJson(['success' => true]);

            $this->assertEquals($initialBoxStock - 1, $box->fresh()->stock);
            $this->assertEquals($initialUnitStock + $multiplier, $unit->fresh()->stock);
        } else {
            $this->markTestSkipped('No Box and Unit items found for conversion testing.');
        }
    }

    public function test_ai_demand_forecasting_endpoint(): void
    {
        $response = $this->getJson('/api/forecast');
        $response->assertStatus(200);
        $this->assertIsArray($response->json());
        $first = $response->json()[0] ?? null;
        if ($first) {
            $this->assertArrayHasKey('id', $first);
            $this->assertArrayHasKey('name', $first);
            $this->assertArrayHasKey('current_stock', $first);
            $this->assertArrayHasKey('forecast_30d', $first);
            $this->assertArrayHasKey('reorder_status', $first);
        }
    }

    public function test_stock_in_parent_children_relationship(): void
    {
        $products = Product::take(2)->get();
        if ($products->count() < 2) {
            $this->markTestSkipped('Not enough products for multi-item stock in test.');
        }

        $p1 = $products[0];
        $p2 = $products[1];

        $payload = [
            'supplier_name' => 'Zuellig Pharma Test',
            'reference_no' => 'DR-MULTI-' . time(),
            'received_by' => 'Pharmacist Lead',
            'notes' => 'Multi-item shipment receipt test',
            'items' => [
                [
                    'product_id' => $p1->id,
                    'qty' => 20,
                    'unit_cost' => 15.00,
                    'batch_no' => 'BAT-M1',
                    'expiry_date' => '2028-10-31'
                ],
                [
                    'product_id' => $p2->id,
                    'qty' => 30,
                    'unit_cost' => 25.00,
                    'batch_no' => 'BAT-M2',
                    'expiry_date' => '2028-11-30'
                ]
            ]
        ];

        $response = $this->postJson('/api/stock-in', $payload);
        $response->assertStatus(201);
        $stockInId = $response->json('stockIn.id');

        $stockIn = \App\Models\StockIn::with('items')->find($stockInId);
        $this->assertNotNull($stockIn);
        $this->assertEquals(2, $stockIn->items->count());
        $this->assertEquals(2, $stockIn->details->count());
        $this->assertEquals((20 * 15.00) + (30 * 25.00), $stockIn->total_amount);

        // Test show endpoint
        $showRes = $this->getJson("/api/stock-in/{$stockInId}");
        $showRes->assertStatus(200);
        $this->assertEquals(2, count($showRes->json('items')));
    }

    public function test_stock_out_parent_children_relationship(): void
    {
        $products = Product::where('stock', '>=', 10)->take(2)->get();
        if ($products->count() < 2) {
            $this->markTestSkipped('Not enough products with stock >= 10 for multi-item stock out test.');
        }

        $p1 = $products[0];
        $p2 = $products[1];

        $payload = [
            'reason' => 'Expired Medicine Disposal',
            'authorized_by' => 'Audit Officer',
            'reference_no' => 'SO-MULTI-' . time(),
            'notes' => 'Multi-item disposal test',
            'items' => [
                [
                    'product_id' => $p1->id,
                    'qty' => 3,
                    'batch_no' => $p1->batch_no ?: 'BAT-SO1'
                ],
                [
                    'product_id' => $p2->id,
                    'qty' => 4,
                    'batch_no' => $p2->batch_no ?: 'BAT-SO2'
                ]
            ]
        ];

        $response = $this->postJson('/api/stock-out', $payload);
        $response->assertStatus(201);
        $stockOutId = $response->json('stockOut.id');

        $stockOut = \App\Models\StockOut::with('items')->find($stockOutId);
        $this->assertNotNull($stockOut);
        $this->assertEquals(2, $stockOut->items->count());
        $this->assertEquals(2, $stockOut->details->count());

        // Test show endpoint
        $showRes = $this->getJson("/api/stock-out/{$stockOutId}");
        $showRes->assertStatus(200);
        $this->assertEquals(2, count($showRes->json('items')));
    }

    public function test_stock_in_parent_update_and_delete_reversal(): void
    {
        $product = Product::create([
            'sku' => 'TEST-REV-' . rand(1000, 9999),
            'name' => 'Reversal Test Paracetamol',
            'category' => 'Analgesic',
            'dosage' => '500mg',
            'stock' => 50,
            'unit_price' => 10.00,
            'cost_price' => 5.00,
            'status' => 'IN_STOCK'
        ]);

        $initialStock = $product->stock;

        // 1. Add Stock In (Parent + Children)
        $addRes = $this->postJson('/api/stock-in', [
            'refNo' => 'DR-REV-' . rand(1000, 9999),
            'supplierName' => 'Initial Supplier Inc.',
            'receivedBy' => 'Admin User',
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 30,
                    'cost_price' => 5.50,
                    'batch_no' => 'BAT-R1'
                ]
            ]
        ]);
        $addRes->assertStatus(201);
        $stockInId = $addRes->json('stockIn.id');

        // Stock should have increased by 30
        $product->refresh();
        $this->assertEquals($initialStock + 30, $product->stock);

        // 2. Edit Parent
        $updateRes = $this->putJson("/api/stock-in/{$stockInId}", [
            'supplierName' => 'Updated Primary Distributor',
            'receivedBy' => 'Lead Pharmacist',
            'notes' => 'Quality inspection passed without defects'
        ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('Updated Primary Distributor', $updateRes->json('stockIn.supplier_name'));

        // 3. Delete Parent (and verify stock reversal)
        $deleteRes = $this->deleteJson("/api/stock-in/{$stockInId}");
        $deleteRes->assertStatus(200);

        // Stock should be safely restored to initial stock (decreased by 30)
        $product->refresh();
        $this->assertEquals($initialStock, $product->stock);
        $this->assertNull(\App\Models\StockIn::find($stockInId));
    }

    public function test_stock_out_parent_update_and_delete_reversal(): void
    {
        $product = Product::create([
            'sku' => 'TEST-SOREV-' . rand(1000, 9999),
            'name' => 'Stock Out Reversal Test Amoxicillin',
            'category' => 'Antibiotic',
            'dosage' => '500mg',
            'stock' => 100,
            'unit_price' => 15.00,
            'cost_price' => 8.00,
            'status' => 'IN_STOCK'
        ]);

        $initialStock = $product->stock;

        // 1. Record Stock Out (Parent + Children)
        $addRes = $this->postJson('/api/stock-out', [
            'refNo' => 'SO-REV-' . rand(1000, 9999),
            'reason' => 'Expired Medicine Disposal',
            'authorizedBy' => 'Licensed Pharmacist',
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 25,
                    'batch_no' => 'BAT-EXP'
                ]
            ]
        ]);
        $addRes->assertStatus(201);
        $stockOutId = $addRes->json('stockOut.id');

        // Stock should have decreased by 25
        $product->refresh();
        $this->assertEquals($initialStock - 25, $product->stock);

        // 2. Edit Parent
        $updateRes = $this->putJson("/api/stock-out/{$stockOutId}", [
            'reason' => 'Damaged / Broken Goods Write-off',
            'notes' => 'Verified water damage during shipment'
        ]);
        $updateRes->assertStatus(200);
        $this->assertEquals('Damaged / Broken Goods Write-off', $updateRes->json('stockOut.reason'));

        // 3. Delete Parent (and verify stock restoration)
        $deleteRes = $this->deleteJson("/api/stock-out/{$stockOutId}");
        $deleteRes->assertStatus(200);

        // Stock should be restored back to initial stock (increased by 25)
        $product->refresh();
        $this->assertEquals($initialStock, $product->stock);
        $this->assertNull(\App\Models\StockOut::find($stockOutId));
    }

    public function test_supplier_crud_lifecycle(): void
    {
        // 1. List Suppliers
        $listRes = $this->getJson('/api/suppliers');
        $listRes->assertStatus(200);
        $this->assertIsArray($listRes->json());

        // 2. Add New Supplier
        $createPayload = [
            'name' => 'Metro Drug Distribution Corp',
            'contact_person' => 'Carlos Mendoza',
            'phone' => '+63 920 123 4567',
            'email' => 'carlos.mendoza@metrodrug.com.ph',
            'address' => 'Sta. Rosa, Laguna, Philippines'
        ];
        $createRes = $this->postJson('/api/suppliers', $createPayload);
        $createRes->assertStatus(201);
        $createRes->assertJson([
            'success' => true,
            'message' => 'Supplier added successfully.'
        ]);
        $supplierId = $createRes->json('supplier.id');
        $this->assertNotNull($supplierId);

        // Verify in DB
        $supplier = Supplier::find($supplierId);
        $this->assertNotNull($supplier);
        $this->assertEquals('Metro Drug Distribution Corp', $supplier->name);

        // 3. Update Supplier
        $updatePayload = [
            'name' => 'Metro Drug Distribution Philippines Inc.',
            'contact_person' => 'Carlos A. Mendoza Jr.',
            'phone' => '+63 920 987 6543',
            'email' => 'orders@metrodrug.com.ph',
            'address' => 'Biñan Tech Park, Laguna'
        ];
        $updateRes = $this->putJson("/api/suppliers/{$supplierId}", $updatePayload);
        $updateRes->assertStatus(200);
        $updateRes->assertJson([
            'success' => true,
            'message' => 'Supplier updated successfully.'
        ]);
        $supplier->refresh();
        $this->assertEquals('Metro Drug Distribution Philippines Inc.', $supplier->name);
        $this->assertEquals('Carlos A. Mendoza Jr.', $supplier->contact_person);

        // 4. Delete Supplier
        $deleteRes = $this->deleteJson("/api/suppliers/{$supplierId}");
        $deleteRes->assertStatus(200);
        $deleteRes->assertJson([
            'success' => true,
            'message' => 'Supplier removed.'
        ]);

        $this->assertNull(Supplier::find($supplierId));
    }
}

