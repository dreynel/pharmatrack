<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Conversion;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockIn;
use App\Models\StockInItem;
use App\Models\StockMovement;
use App\Models\StockOut;
use App\Models\StockOutItem;
use App\Models\Supplier;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users
        User::updateOrCreate(
            ['email' => 'admin@pharmatrack.com'],
            [
                'name' => 'Xyra Andrea (Admin)',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@pharmatrack.local'],
            [
                'name' => 'Xyra Andrea (Admin)',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'cashier@pharmatrack.local'],
            [
                'name' => 'Cashier Xyra',
                'password' => Hash::make('cashier123'),
                'role' => 'cashier',
            ]
        );

        // 2. Categories
        $categories = [
            'Analgesics' => 'Pain relievers, antipyretics, and fever control medications',
            'Antibiotics' => 'Antibacterial and prescription anti-infectives',
            'Respiratory' => 'Decongestants, antitussives, and antihistamines for colds/cough',
            'Vitamins & Supplements' => 'Daily dietary multivitamins, minerals, and immune boosters',
            'Cardiovascular' => 'Hypertension, heart care, and maintenance medications',
            'Antihistamines' => 'Allergy relief, anti-itch, and non-drowsy formulations',
            'First Aid' => 'Antiseptics, rubbing alcohol, bandages, and clinical supplies',
            'Gastrointestinal' => 'Antacids, anti-diarrheal, and digestive health medications',
        ];

        $catModels = [];
        foreach ($categories as $name => $desc) {
            $catModels[$name] = Category::updateOrCreate(['name' => $name], ['description' => $desc]);
        }

        // 3. Suppliers
        $suppliersData = [
            [
                'name' => 'Unilab Distribution Phils',
                'contact_person' => 'Mr. Ramon Garcia',
                'phone' => '0917-123-4567',
                'email' => 'orders@unilab.com.ph',
                'address' => 'Mandaluyong City, Metro Manila',
                'active_pos' => 2,
            ],
            [
                'name' => 'Pascual Laboratories Inc.',
                'contact_person' => 'Ms. Elena Santos',
                'phone' => '0918-987-6543',
                'email' => 'sales@pascual-lab.com',
                'address' => 'Balintawak, Quezon City',
                'active_pos' => 1,
            ],
            [
                'name' => 'Zuellig Pharma Philippines',
                'contact_person' => 'Mr. Michael Tan',
                'phone' => '0922-555-8888',
                'email' => 'supply@zuelligpharma.com',
                'address' => 'KM 14 West Service Rd, Parañaque City',
                'active_pos' => 0,
            ],
        ];

        $supModels = [];
        foreach ($suppliersData as $sup) {
            $supModels[$sup['name']] = Supplier::updateOrCreate(['name' => $sup['name']], $sup);
        }

        // 4. Products (Medicines & Wholesale Bulk boxes)
        // Retail Child 1
        $p1 = Product::updateOrCreate(
            ['sku' => 'MED-001'],
            [
                'barcode' => '4800012345678',
                'name' => 'Biogesic Paracetamol 500mg',
                'generic_name' => 'Paracetamol',
                'category_id' => $catModels['Analgesics']->id,
                'category' => 'Analgesics',
                'uom' => 'Tablet',
                'unit_price' => 7.50,
                'cost_price' => 4.50,
                'stock' => 450,
                'reorder_point' => 100,
                'batch_no' => 'B-2024-098',
                'expiry_date' => '2027-11-15',
                'daily_avg_sales' => 45,
                'forecast_demand_30d' => 1450,
                'status' => 'In Stock',
                'is_bulk' => false,
            ]
        );

        // Bulk Parent 1
        $p101 = Product::updateOrCreate(
            ['sku' => 'BLK-001'],
            [
                'barcode' => '4800012345601',
                'name' => 'Biogesic Paracetamol 500mg (Box of 100)',
                'generic_name' => 'Paracetamol (Bulk)',
                'category_id' => $catModels['Analgesics']->id,
                'category' => 'Analgesics',
                'uom' => 'Box (100s)',
                'unit_price' => 700.00,
                'cost_price' => 420.00,
                'stock' => 24,
                'reorder_point' => 5,
                'batch_no' => 'B-2024-098',
                'expiry_date' => '2027-11-15',
                'daily_avg_sales' => 2,
                'forecast_demand_30d' => 15,
                'status' => 'In Stock',
                'is_bulk' => true,
                'conversion_rate' => 100,
                'child_product_id' => $p1->id,
            ]
        );
        $p1->parent_product_id = $p101->id;
        $p1->save();

        // Retail Child 2
        $p2 = Product::updateOrCreate(
            ['sku' => 'MED-002'],
            [
                'barcode' => '4800012345679',
                'name' => 'Amoxil Amoxicillin 500mg Capsule',
                'generic_name' => 'Amoxicillin',
                'category_id' => $catModels['Antibiotics']->id,
                'category' => 'Antibiotics',
                'uom' => 'Capsule',
                'unit_price' => 15.00,
                'cost_price' => 9.00,
                'stock' => 35,
                'reorder_point' => 50,
                'batch_no' => 'B-2024-112',
                'expiry_date' => '2026-10-20',
                'daily_avg_sales' => 22,
                'forecast_demand_30d' => 680,
                'status' => 'Low Stock',
                'is_bulk' => false,
            ]
        );

        // Bulk Parent 2
        $p102 = Product::updateOrCreate(
            ['sku' => 'BLK-002'],
            [
                'barcode' => '4800012345602',
                'name' => 'Amoxil Amoxicillin 500mg (Box of 100)',
                'generic_name' => 'Amoxicillin (Bulk)',
                'category_id' => $catModels['Antibiotics']->id,
                'category' => 'Antibiotics',
                'uom' => 'Box (100s)',
                'unit_price' => 1400.00,
                'cost_price' => 850.00,
                'stock' => 12,
                'reorder_point' => 4,
                'batch_no' => 'B-2024-112',
                'expiry_date' => '2026-10-20',
                'daily_avg_sales' => 1,
                'forecast_demand_30d' => 7,
                'status' => 'In Stock',
                'is_bulk' => true,
                'conversion_rate' => 100,
                'child_product_id' => $p2->id,
            ]
        );
        $p2->parent_product_id = $p102->id;
        $p2->save();

        // Product 3 - Expiring Soon
        $p3 = Product::updateOrCreate(
            ['sku' => 'MED-003'],
            [
                'barcode' => '4800012345680',
                'name' => 'Neozep Forte Tablet',
                'generic_name' => 'Phenylephrine HCl + Chlorphenamine',
                'category_id' => $catModels['Respiratory']->id,
                'category' => 'Respiratory',
                'uom' => 'Tablet',
                'unit_price' => 9.00,
                'cost_price' => 5.50,
                'stock' => 320,
                'reorder_point' => 80,
                'batch_no' => 'B-2024-145',
                'expiry_date' => Carbon::now()->addDays(20)->toDateString(),
                'daily_avg_sales' => 30,
                'forecast_demand_30d' => 900,
                'status' => 'Expiring Soon',
                'is_bulk' => false,
            ]
        );

        // Product 4 - Conzace
        $p4 = Product::updateOrCreate(
            ['sku' => 'MED-004'],
            [
                'barcode' => '4800012345681',
                'name' => 'Conzace Soft Gel Capsule',
                'generic_name' => 'Multivitamins + Zinc',
                'category_id' => $catModels['Vitamins & Supplements']->id,
                'category' => 'Vitamins & Supplements',
                'uom' => 'Capsule',
                'unit_price' => 16.50,
                'cost_price' => 11.00,
                'stock' => 580,
                'reorder_point' => 120,
                'batch_no' => 'B-2024-204',
                'expiry_date' => '2028-01-30',
                'daily_avg_sales' => 40,
                'forecast_demand_30d' => 1250,
                'status' => 'In Stock',
                'is_bulk' => false,
            ]
        );

        $p104 = Product::updateOrCreate(
            ['sku' => 'BLK-004'],
            [
                'barcode' => '4800012345604',
                'name' => 'Conzace Soft Gel Capsule (Box of 100)',
                'generic_name' => 'Multivitamins + Zinc (Bulk)',
                'category_id' => $catModels['Vitamins & Supplements']->id,
                'category' => 'Vitamins & Supplements',
                'uom' => 'Box (100s)',
                'unit_price' => 1550.00,
                'cost_price' => 1050.00,
                'stock' => 18,
                'reorder_point' => 5,
                'batch_no' => 'B-2024-204',
                'expiry_date' => '2028-01-30',
                'daily_avg_sales' => 2,
                'forecast_demand_30d' => 13,
                'status' => 'In Stock',
                'is_bulk' => true,
                'conversion_rate' => 100,
                'child_product_id' => $p4->id,
            ]
        );
        $p4->parent_product_id = $p104->id;
        $p4->save();

        // Product 5 - Critical Low
        $p5 = Product::updateOrCreate(
            ['sku' => 'MED-005'],
            [
                'barcode' => '4800012345682',
                'name' => 'Alaxan FR Capsule',
                'generic_name' => 'Ibuprofen + Paracetamol',
                'category_id' => $catModels['Analgesics']->id,
                'category' => 'Analgesics',
                'uom' => 'Capsule',
                'unit_price' => 11.00,
                'cost_price' => 7.00,
                'stock' => 12,
                'reorder_point' => 60,
                'batch_no' => 'B-2024-055',
                'expiry_date' => '2027-05-18',
                'daily_avg_sales' => 25,
                'forecast_demand_30d' => 790,
                'status' => 'Critical Low',
                'is_bulk' => false,
            ]
        );

        // Product 6 - Norvasc
        Product::updateOrCreate(
            ['sku' => 'MED-006'],
            [
                'barcode' => '4800012345683',
                'name' => 'Norvasc Amlodipine 5mg Tablet',
                'generic_name' => 'Amlodipine Besilate',
                'category_id' => $catModels['Cardiovascular']->id,
                'category' => 'Cardiovascular',
                'uom' => 'Tablet',
                'unit_price' => 22.00,
                'cost_price' => 14.00,
                'stock' => 210,
                'reorder_point' => 40,
                'batch_no' => 'B-2024-301',
                'expiry_date' => '2027-08-12',
                'daily_avg_sales' => 15,
                'forecast_demand_30d' => 460,
                'status' => 'In Stock',
                'is_bulk' => false,
            ]
        );

        // Product 7 - Allerkid
        Product::updateOrCreate(
            ['sku' => 'MED-007'],
            [
                'barcode' => '4800012345684',
                'name' => 'Allerkid Cetirizine 10mg',
                'generic_name' => 'Cetirizine Dihydrochloride',
                'category_id' => $catModels['Antihistamines']->id,
                'category' => 'Antihistamines',
                'uom' => 'Tablet',
                'unit_price' => 14.50,
                'cost_price' => 8.50,
                'stock' => 180,
                'reorder_point' => 50,
                'batch_no' => 'B-2024-188',
                'expiry_date' => '2026-12-05',
                'daily_avg_sales' => 18,
                'forecast_demand_30d' => 550,
                'status' => 'In Stock',
                'is_bulk' => false,
            ]
        );

        // Product 8 - Rhea Alcohol
        $p8 = Product::updateOrCreate(
            ['sku' => 'SUP-001'],
            [
                'barcode' => '4800012345685',
                'name' => 'Rhea Isopropyl Alcohol 70% 500ml',
                'generic_name' => 'Isopropyl Alcohol',
                'category_id' => $catModels['First Aid']->id,
                'category' => 'First Aid',
                'uom' => 'Bottle',
                'unit_price' => 85.00,
                'cost_price' => 55.00,
                'stock' => 95,
                'reorder_point' => 30,
                'batch_no' => 'B-2024-402',
                'expiry_date' => '2029-03-01',
                'daily_avg_sales' => 8,
                'forecast_demand_30d' => 250,
                'status' => 'In Stock',
                'is_bulk' => false,
            ]
        );

        // Product 9 - Kremil-S
        Product::updateOrCreate(
            ['sku' => 'MED-009'],
            [
                'barcode' => '4800012345686',
                'name' => 'Kremil-S Antacid Chewable Tablet',
                'generic_name' => 'Aluminum Hydroxide + Magnesium Hydroxide + Simethicone',
                'category_id' => $catModels['Gastrointestinal']->id,
                'category' => 'Gastrointestinal',
                'uom' => 'Tablet',
                'unit_price' => 8.50,
                'cost_price' => 5.00,
                'stock' => 280,
                'reorder_point' => 60,
                'batch_no' => 'B-2024-511',
                'expiry_date' => '2027-09-25',
                'daily_avg_sales' => 20,
                'forecast_demand_30d' => 600,
                'status' => 'In Stock',
                'is_bulk' => false,
            ]
        );

        // 5. Initial Realistic Sales
        $sale1 = Sale::create([
            'invoice_no' => 'TXN-98421',
            'cashier' => 'Cashier Xyra',
            'subtotal' => 157.50,
            'discount' => 0.00,
            'discount_type' => 'None',
            'customer_type' => 'Regular',
            'total' => 157.50,
            'payment_method' => 'Cash',
            'amount_paid' => 200.00,
            'change' => 42.50,
            'created_at' => Carbon::now()->subHours(4),
        ]);

        SaleItem::create([
            'sale_id' => $sale1->id,
            'product_id' => $p1->id,
            'product_name' => $p1->name,
            'quantity' => 10,
            'unit_price' => 7.50,
            'cost_price' => 4.50,
            'subtotal' => 75.00,
        ]);

        SaleItem::create([
            'sale_id' => $sale1->id,
            'product_id' => $p4->id,
            'product_name' => $p4->name,
            'quantity' => 5,
            'unit_price' => 16.50,
            'cost_price' => 11.00,
            'subtotal' => 82.50,
        ]);

        $sale2 = Sale::create([
            'invoice_no' => 'TXN-98420',
            'cashier' => 'Admin Andrea',
            'subtotal' => 260.00,
            'discount' => 13.00,
            'discount_type' => 'Senior Citizen',
            'customer_type' => 'Senior Citizen',
            'customer_name' => 'Lola Remedios Cruz',
            'customer_id_no' => 'SC-2019-8812',
            'total' => 247.00,
            'payment_method' => 'GCash',
            'amount_paid' => 247.00,
            'change' => 0.00,
            'created_at' => Carbon::now()->subHours(6),
        ]);

        SaleItem::create([
            'sale_id' => $sale2->id,
            'product_id' => $p8->id,
            'product_name' => $p8->name,
            'quantity' => 2,
            'unit_price' => 85.00,
            'cost_price' => 55.00,
            'subtotal' => 170.00,
        ]);

        SaleItem::create([
            'sale_id' => $sale2->id,
            'product_id' => $p3->id,
            'product_name' => $p3->name,
            'quantity' => 10,
            'unit_price' => 9.00,
            'cost_price' => 5.50,
            'subtotal' => 90.00,
        ]);

        // 6. Stock In Records
        $stkIn1 = StockIn::create([
            'ref_no' => 'DR-2026-8891',
            'supplier_id' => $supModels['Unilab Distribution Phils']->id,
            'supplier_name' => 'Unilab Distribution Phils',
            'date' => Carbon::now()->subDays(5)->toDateString(),
            'received_by' => 'Xyra Andrea',
            'total_amount' => 18900.00,
            'notes' => 'Standard replenishment batch for analgesics and vitamins.',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        StockInItem::create([
            'stock_in_id' => $stkIn1->id,
            'product_id' => $p101->id,
            'product_name' => $p101->name,
            'quantity' => 20,
            'cost_price' => 420.00,
            'batch_no' => 'B-2024-098',
            'expiry_date' => '2027-11-15',
        ]);

        StockInItem::create([
            'stock_in_id' => $stkIn1->id,
            'product_id' => $p104->id,
            'product_name' => $p104->name,
            'quantity' => 10,
            'cost_price' => 1050.00,
            'batch_no' => 'B-2024-204',
            'expiry_date' => '2028-01-30',
        ]);

        // 7. Stock Out Records
        $stkOut1 = StockOut::create([
            'ref_no' => 'SO-2026-102',
            'reason' => 'Expired Medicine Disposal',
            'date' => Carbon::now()->subDays(2)->toDateString(),
            'authorized_by' => 'Xyra Andrea (Manager)',
            'notes' => 'Near-expiry batches pulled from shelf following DOH protocol.',
            'created_at' => Carbon::now()->subDays(2),
        ]);

        StockOutItem::create([
            'stock_out_id' => $stkOut1->id,
            'product_id' => $p3->id,
            'product_name' => $p3->name,
            'quantity' => 20,
            'cost_price' => 5.50,
            'batch_no' => 'B-2023-011',
        ]);

        $stkOut2 = StockOut::create([
            'ref_no' => 'SO-2026-108',
            'reason' => 'Internal Clinic Use',
            'date' => Carbon::now()->subDay()->toDateString(),
            'authorized_by' => 'Xyra Andrea (Manager)',
            'notes' => 'Pharmacy counter disinfection and sanitization station refill.',
            'created_at' => Carbon::now()->subDay(),
        ]);

        StockOutItem::create([
            'stock_out_id' => $stkOut2->id,
            'product_id' => $p8->id,
            'product_name' => $p8->name,
            'quantity' => 2,
            'cost_price' => 55.00,
            'batch_no' => 'B-2024-402',
        ]);

        // 8. Conversions
        Conversion::create([
            'conv_code' => 'CONV-8821',
            'date' => Carbon::now()->subDays(3),
            'source_product_id' => $p101->id,
            'source_product_name' => $p101->name,
            'source_uom' => $p101->uom,
            'source_qty' => 2,
            'target_product_id' => $p1->id,
            'target_product_name' => $p1->name,
            'target_uom' => $p1->uom,
            'target_qty' => 200,
            'multiplier' => 100,
            'batch_no' => 'B-2024-098',
            'expiry_date' => '2027-11-15',
            'operator' => 'Xyra Andrea (Pharmacist)',
            'notes' => 'Unboxed 2 bulk cartons into 200 individual blister tablets for POS counter',
            'created_at' => Carbon::now()->subDays(3),
        ]);

        // 9. Stock Movement Ledger Entries
        $movements = [
            [
                'movement_code' => 'MOV-99201',
                'timestamp' => Carbon::now()->subHours(4),
                'product_id' => $p1->id,
                'product_name' => $p1->name,
                'type' => 'POS_SALE',
                'qty_change' => -10,
                'previous_stock' => 460,
                'new_stock' => 450,
                'reference_id' => 'TXN-98421',
                'remarks' => 'Sold at POS Counter (Receipt #TXN-98421)',
            ],
            [
                'movement_code' => 'MOV-99200',
                'timestamp' => Carbon::now()->subHours(6),
                'product_id' => $p8->id,
                'product_name' => $p8->name,
                'type' => 'POS_SALE',
                'qty_change' => -2,
                'previous_stock' => 97,
                'new_stock' => 95,
                'reference_id' => 'TXN-98420',
                'remarks' => 'Sold at POS Counter (Receipt #TXN-98420)',
            ],
            [
                'movement_code' => 'MOV-99199',
                'timestamp' => Carbon::now()->subDay(),
                'product_id' => $p8->id,
                'product_name' => $p8->name,
                'type' => 'STOCK_OUT',
                'qty_change' => -2,
                'previous_stock' => 99,
                'new_stock' => 97,
                'reference_id' => 'SO-2026-108',
                'remarks' => 'Stock Out: Internal Clinic Use - Auth: Xyra Andrea',
            ],
            [
                'movement_code' => 'MOV-99198',
                'timestamp' => Carbon::now()->subDays(3),
                'product_id' => $p1->id,
                'product_name' => $p1->name,
                'type' => 'CONVERT_IN',
                'qty_change' => 200,
                'previous_stock' => 260,
                'new_stock' => 460,
                'reference_id' => 'CONV-8821',
                'remarks' => 'Received 200 Tablet from Biogesic Box of 100 (CONV-8821)',
            ],
            [
                'movement_code' => 'MOV-99197',
                'timestamp' => Carbon::now()->subDays(3),
                'product_id' => $p101->id,
                'product_name' => $p101->name,
                'type' => 'CONVERT_OUT',
                'qty_change' => -2,
                'previous_stock' => 26,
                'new_stock' => 24,
                'reference_id' => 'CONV-8821',
                'remarks' => 'Converted 2 Box (100s) to 200 Tablet',
            ],
            [
                'movement_code' => 'MOV-99196',
                'timestamp' => Carbon::now()->subDays(5),
                'product_id' => $p101->id,
                'product_name' => $p101->name,
                'type' => 'STOCK_IN',
                'qty_change' => 20,
                'previous_stock' => 4,
                'new_stock' => 24,
                'reference_id' => 'DR-2026-8891',
                'remarks' => 'Received from Unilab Distribution Phils (Batch B-2024-098)',
            ],
        ];

        foreach ($movements as $m) {
            StockMovement::create($m);
        }

        // 10. Purchase Orders
        PurchaseOrder::create([
            'po_number' => 'PO-20260828-4412',
            'supplier_id' => $supModels['Unilab Distribution Phils']->id,
            'supplier_name' => 'Unilab Distribution Phils',
            'product_id' => $p5->id,
            'product_name' => $p5->name,
            'suggested_qty' => 100,
            'order_qty' => 100,
            'unit_cost' => 7.00,
            'total_cost' => 700.00,
            'status' => 'Pending',
            'expected_delivery' => Carbon::now()->addDays(3)->toDateString(),
            'notes' => 'Critical stock replenishment triggered by AI forecasting safety buffer.',
        ]);
    }
}
