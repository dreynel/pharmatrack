<?php

namespace App\Http\Controllers;

use App\Models\StockIn;
use App\Services\StockTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class StockInController extends Controller
{
    protected StockTransferService $stockTransferService;

    public function __construct(StockTransferService $stockTransferService)
    {
        $this->stockTransferService = $stockTransferService;
    }

    public function index(): JsonResponse
    {
        $stockIns = StockIn::with('items')->latest()->take(100)->get();
        return response()->json($stockIns);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.productId' => 'nullable|integer',
            'items.*.product_id' => 'nullable|integer',
            'items.*.qty' => 'required|integer|min:1',
            'supplierName' => 'nullable|string',
            'refNo' => 'nullable|string',
        ]);

        try {
            $stockIn = $this->stockTransferService->processStockIn($request->all());

            return response()->json([
                'success' => true,
                'message' => "Shipment #{$stockIn->ref_no} received and stock updated successfully!",
                'stockIn' => $stockIn,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function show(string|int $id): JsonResponse
    {
        $stockIn = is_numeric($id)
            ? StockIn::with('items')->findOrFail($id)
            : StockIn::with('items')->where('ref_no', $id)->firstOrFail();

        return response()->json($stockIn);
    }

    public function update(Request $request, string|int $id): JsonResponse
    {
        try {
            $stockIn = $this->stockTransferService->updateStockIn($id, $request->all());
            return response()->json([
                'success' => true,
                'message' => 'Shipment updated successfully.',
                'stockIn' => $stockIn
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function destroy(string|int $id): JsonResponse
    {
        try {
            $this->stockTransferService->deleteStockIn($id);
            return response()->json([
                'success' => true,
                'message' => 'Shipment deleted and stock balances reversed.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}

