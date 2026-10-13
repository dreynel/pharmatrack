<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function index(): View
    {
        return view('pharmatrack');
    }

    public function metrics(): JsonResponse
    {
        $metrics = $this->reportService->getDashboardMetrics();
        return response()->json($metrics);
    }

    public function stats(): JsonResponse
    {
        return $this->metrics();
    }
}
