<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    protected ReportService $reportService;

    public function __construct(ReportService $reportService)
    {
        $this->reportService = $reportService;
    }

    public function sales(Request $request): JsonResponse
    {
        return response()->json($this->reportService->getSalesReport($request->get('range', 'month')));
    }

    public function valuation(): JsonResponse
    {
        return response()->json($this->reportService->getValuationReport());
    }

    public function losses(): JsonResponse
    {
        return response()->json($this->reportService->getLossReport());
    }

    public function fsn(): JsonResponse
    {
        return response()->json($this->reportService->getFsnAnalysis());
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $type = $request->get('type', 'sales');
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=pharmatrack_{$type}_report.csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        return response()->stream(function () use ($type) {
            $handle = fopen('php://output', 'w');
            if ($type === 'valuation') {
                fputcsv($handle, ['SKU', 'Name', 'Category', 'UOM', 'Stock', 'Cost Price', 'Selling Price', 'Margin %']);
                $report = $this->reportService->getValuationReport();
                foreach ($report['items'] as $item) {
                    fputcsv($handle, [
                        $item['sku'],
                        $item['name'],
                        $item['category'],
                        $item['uom'],
                        $item['stock'],
                        $item['cost_price'],
                        $item['unit_price'],
                        $item['margin'] . '%'
                    ]);
                }
            } else {
                fputcsv($handle, ['Invoice #', 'Date', 'Cashier', 'Subtotal', 'Discount', 'Total', 'Payment Method']);
                $salesData = $this->reportService->getSalesReport('all');
                foreach ($salesData['sales'] as $sale) {
                    fputcsv($handle, [
                        $sale->invoice_no,
                        $sale->created_at,
                        $sale->cashier,
                        $sale->subtotal,
                        $sale->discount,
                        $sale->total,
                        $sale->payment_method
                    ]);
                }
            }
            fclose($handle);
        }, 200, $headers);
    }
}
