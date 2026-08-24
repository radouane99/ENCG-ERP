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
        return $this->storeDsar($request, 'access');
    }

    public function requestRectification(Request $request): JsonResponse
    {
        return $this->storeDsar($request, 'rectification');
    }

    public function requestOpposition(Request $request): JsonResponse
    {
        return $this->storeDsar($request, 'opposition');
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

    private function storeDsar(Request $request, string $type): JsonResponse
    {
        $validated = $request->validate([
            'format' => ['sometimes', 'in:json,pdf'],
            'payload' => ['sometimes', 'array'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $export = DataExportRequest::create([
            'institution_id' => $user->institution_id ?? 1,
            'user_id' => $user->id,
            'request_type' => $type,
            'status' => 'pending',
            'export_format' => $validated['format'] ?? 'json',
            'payload' => $validated['payload'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($type === 'access') {
            ProcessDataExportRequest::dispatch($export->id);
        }

        $messages = [
            'access' => 'Demande d\'accès (DSAR) enregistrée.',
            'rectification' => 'Demande de rectification (CNDP art. 8) enregistrée.',
            'opposition' => 'Demande d\'opposition (CNDP art. 9) enregistrée. Les dossiers académiques restent conservés jusqu\'à instruction de la scolarité.',
        ];

        return response()->json([
            'success' => true,
            'message' => $messages[$type],
            'data' => $export,
        ], 202);
    }
}
