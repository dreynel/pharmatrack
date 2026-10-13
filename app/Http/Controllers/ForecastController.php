<?php

namespace App\Http\Controllers;

use App\Services\ForecastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForecastController extends Controller
{
    protected ForecastService $forecastService;

    public function __construct(ForecastService $forecastService)
    {
        $this->forecastService = $forecastService;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->forecastService->generateForecasts());
    }

    public function createPurchaseOrder(Request $request): JsonResponse
    {
        try {
            $po = $this->forecastService->createPurchaseOrder($request->all());
            return response()->json([
                'success' => true,
                'message' => "Purchase Order #{$po->po_number} successfully placed with {$po->supplier_name}!",
                'po' => $po
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
