<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockMovement::query();

        if ($request->has('type') && $request->type !== 'all' && !empty($request->type)) {
            $query->where('type', $request->type);
        }

        if ($request->has('search') && !empty($request->search)) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('product_name', 'like', "%{$term}%")
                  ->orWhere('movement_code', 'like', "%{$term}%")
                  ->orWhere('reference_id', 'like', "%{$term}%")
                  ->orWhere('remarks', 'like', "%{$term}%");
            });
        }

        return response()->json($query->latest('timestamp')->take(400)->get());
    }
}
