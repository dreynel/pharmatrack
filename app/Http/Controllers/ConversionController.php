<?php

namespace App\Http\Controllers;

use App\Models\Conversion;
use App\Services\ConversionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversionController extends Controller
{
    protected ConversionService $conversionService;

    public function __construct(ConversionService $conversionService)
    {
        $this->conversionService = $conversionService;
    }

    public function index(): JsonResponse
    {
        return response()->json(Conversion::latest()->take(100)->get());
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $conversion = $this->conversionService->processConversion($request->all());
            return response()->json([
                'success' => true,
                'message' => "Unboxed {$conversion->source_qty} {$conversion->source_uom} into {$conversion->target_qty} {$conversion->target_uom} successfully!",
                'conversion' => $conversion
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
