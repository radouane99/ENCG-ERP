<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessDataExportRequest;
use App\Models\DataExportRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivacyController extends Controller
{
    public function requestExport(Request $request): JsonResponse
    {
        $user = $request->user();

        $export = DataExportRequest::create([
            'institution_id' => $user->institution_id ?? 1,
            'user_id' => $user->id,
            'status' => 'pending',
            'export_format' => $request->input('format', 'json'),
        ]);

        ProcessDataExportRequest::dispatch($export->id);

        return response()->json([
            'success' => true,
            'message' => 'Demande d\'accès (DSAR) enregistrée.',
            'data' => $export,
        ], 202);
    }

    public function myExports(Request $request): JsonResponse
    {
        $exports = DataExportRequest::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $exports]);
    }

    public function download(Request $request, int $id): StreamedResponse|JsonResponse
    {
        $export = DataExportRequest::where('user_id', $request->user()->id)->findOrFail($id);

        if ($export->status !== 'completed' || ! $export->file_path || ! Storage::disk('local')->exists($export->file_path)) {
            return response()->json(['message' => 'Export indisponible.'], 404);
        }

        return Storage::disk('local')->download($export->file_path, 'encg-dsar-'.$export->id.'.json');
    }
}
