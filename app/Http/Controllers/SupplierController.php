<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Supplier::withCount('purchaseOrders')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Supplier added successfully.',
            'supplier' => Supplier::create($validated)
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email',
            'address' => 'nullable|string'
        ]);
        $supplier->update($validated);
        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully.',
            'supplier' => $supplier
        ]);
    }

    public function destroy($id): JsonResponse
    {
        Supplier::findOrFail($id)->delete();
        return response()->json([
            'success' => true,
            'message' => 'Supplier removed.'
        ]);
    }

    public function purchaseOrders(): JsonResponse
    {
        return response()->json(PurchaseOrder::with(['supplier', 'product'])->latest()->get());
    }
}
