<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->has('category') && $request->category !== 'all' && $request->category !== '') {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && !empty($request->search)) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('generic_name', 'like', "%{$term}%")
                  ->orWhere('sku', 'like', "%{$term}%")
                  ->orWhere('barcode', 'like', "%{$term}%");
            });
        }

        $products = $query->orderBy('name')->get();
        return response()->json($products);
    }

    public function show($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        return response()->json($product);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'required|string',
            'uom' => 'required|string',
            'unit_price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'reorder_point' => 'required|integer|min:0',
            'batch_no' => 'nullable|string',
            'expiry_date' => 'nullable|date',
            'sku' => 'nullable|string|unique:products,sku',
            'barcode' => 'nullable|string',
            'is_bulk' => 'nullable|boolean',
            'conversion_rate' => 'nullable|integer',
        ]);

        if (empty($validated['sku'])) {
            $validated['sku'] = 'MED-' . rand(1000, 9999);
        }
        if (empty($validated['barcode'])) {
            $validated['barcode'] = '48000' . rand(10000000, 99999999);
        }

        $product = new Product($validated);
        $product->daily_avg_sales = rand(5, 25);
        $product->forecast_demand_30d = (int)($product->daily_avg_sales * 30);
        $product->recalculateStatus();
        $product->save();

        if ($product->stock > 0) {
            $this->inventoryService->logMovement(
                $product->id,
                $product->name,
                'STOCK_IN',
                $product->stock,
                0,
                $product->stock,
                'NEW-PRODUCT',
                "Initial catalog registration for {$product->name} (Batch {$product->batch_no})"
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Medicine successfully registered in catalog.',
            'product' => $product,
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'generic_name' => 'nullable|string|max:255',
            'category' => 'sometimes|required|string',
            'uom' => 'sometimes|required|string',
            'unit_price' => 'sometimes|required|numeric|min:0',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'reorder_point' => 'sometimes|required|integer|min:0',
            'batch_no' => 'nullable|string',
            'expiry_date' => 'nullable|date',
        ]);

        $product->update($validated);
        $product->recalculateStatus();
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'product' => $product,
        ]);
    }

    public function restock(Request $request, $id): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $product = $this->inventoryService->quickRestock($id, (int)$request->quantity);

        return response()->json([
            'success' => true,
            'message' => "Successfully added {$request->quantity} units to {$product->name}.",
            'product' => $product,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product removed from catalog.',
        ]);
    }
}
