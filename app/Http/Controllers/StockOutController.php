<?php

namespace App\Http\Controllers;

use App\Models\StockOut;
use App\Services\StockTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class StockOutController extends Controller
{
    protected StockTransferService $stockTransferService;

    public function __construct(StockTransferService $stockTransferService)
    {
        $this->stockTransferService = $stockTransferService;
    }

    public function index(): JsonResponse
    {
        return response()->json(StockOut::with('items')->latest()->take(100)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'reason' => 'required|string',
        ]);

        try {
            $stockOut = $this->stockTransferService->processStockOut($request->all());
            return response()->json([
                'success' => true,
                'message' => "Disposal record #{$stockOut->ref_no} recorded successfully!",
                'stockOut' => $stockOut
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function show(string|int $id): JsonResponse
    {
        $stockOut = is_numeric($id)
            ? StockOut::with('items')->findOrFail($id)
            : StockOut::with('items')->where('ref_no', $id)->firstOrFail();

        return response()->json($stockOut);
    }

    public function update(Request $request, string|int $id): JsonResponse
    {
        try {
            $stockOut = $this->stockTransferService->updateStockOut($id, $request->all());
            return response()->json([
                'success' => true,
                'message' => 'Disposal record updated successfully.',
                'stockOut' => $stockOut
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
            $this->stockTransferService->deleteStockOut($id);
            return response()->json([
                'success' => true,
                'message' => 'Disposal record deleted and stock restored.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
