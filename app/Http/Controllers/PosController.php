<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\PosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class PosController extends Controller
{
    protected PosService $posService;

    public function __construct(PosService $posService)
    {
        $this->posService = $posService;
    }

    public function checkout(Request $request): JsonResponse
    {
        $items = array_map(function ($item) {
            if (isset($item['product_id']) && !isset($item['productId'])) {
                $item['productId'] = $item['product_id'];
            }
            if (!isset($item['productId']) && isset($item['id'])) {
                $item['productId'] = $item['id'];
            }
            return $item;
        }, $request->input('items', []));
        $request->merge(['items' => $items]);

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.productId' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
            'payment_method' => 'nullable|string',
            'amount_paid' => 'nullable|numeric',
            'discount' => 'nullable|numeric',
            'discount_type' => 'nullable|string',
            'customer_type' => 'nullable|string',
            'customer_name' => 'nullable|string',
            'customer_id_no' => 'nullable|string',
        ]);

        try {
            $sale = $this->posService->processSale($request->all());

            return response()->json([
                'success' => true,
                'message' => "Transaction #{$sale->invoice_no} completed successfully!",
                'sale' => $sale,
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function sales(Request $request): JsonResponse
    {
        $sales = Sale::with('items')->latest()->take(100)->get();
        return response()->json($sales);
    }

    public function show($id): JsonResponse
    {
        $sale = Sale::with('items')->where('id', $id)->orWhere('invoice_no', $id)->firstOrFail();
        return response()->json($sale);
    }
}
