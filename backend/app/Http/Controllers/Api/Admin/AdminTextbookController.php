<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Textbook;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminTextbookController extends Controller
{
    /**
     * Liste consolidée des cahiers de texte pour le Chef de Département et la Scolarité.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Textbook::with([
            'professor.user',
            'user',
            'module.filiere',
            'module.department',
            'group',
            'validator',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('module_id')) {
            $query->where('module_id', $request->input('module_id'));
        }

        if ($request->filled('professor_id')) {
            $query->where(function ($q) use ($request) {
                $pid = $request->input('professor_id');
                $q->where('professor_id', $pid)->orWhere('user_id', $pid);
            });
        }

        if ($request->filled('date_from')) {
            $query->where('session_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('session_date', '<=', $request->input('date_to'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('chapter_title', 'like', "%{$search}%")
                    ->orWhere('key_concepts', 'like', "%{$search}%")
                    ->orWhereHas('module', fn ($m) => $m->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
            });
        }

        // Global statistics
        $allStats = Textbook::selectRaw("
            COUNT(*) as total_count,
            SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted_count,
            SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated_count,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
            COALESCE(SUM(session_duration_hours), 0) as total_hours,
            COALESCE(SUM(CASE WHEN status = 'validated' THEN session_duration_hours ELSE 0 END), 0) as validated_hours
        ")->first();

        $entries = $query->orderBy('session_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $entries,
            'statistics' => [
                'total_sessions' => (int) ($allStats->total_count ?? 0),
                'submitted_count' => (int) ($allStats->submitted_count ?? 0),
                'validated_count' => (int) ($allStats->validated_count ?? 0),
                'rejected_count' => (int) ($allStats->rejected_count ?? 0),
                'total_hours' => (float) ($allStats->total_hours ?? 0),
                'validated_hours' => (float) ($allStats->validated_hours ?? 0),
            ],
        ]);
    }

    /**
     * Valider ou rejeter une séance du Cahier de Texte (Visa Chef de Département).
     */
    public function validateSession(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'decision' => 'required|in:validated,rejected',
            'comment' => 'nullable|string|max:500',
        ]);

        $entry = Textbook::with(['module', 'user', 'professor'])->findOrFail($id);
        $user = $request->user();

        $entry->status = $validated['decision'];
        $entry->validated_by = $user ? ($user->first_name . ' ' . $user->last_name) : 'Chef de Département';
        $entry->validated_at = now();
        $entry->save();

        // Send notification to the professor
        try {
            $profUserId = $entry->user_id ?? $entry->professor?->user_id;
            if ($profUserId) {
                $statusLabel = $validated['decision'] === 'validated' ? 'Validée ✓' : 'Refusée ✕';
                $modName = $entry->module?->name ?? 'Module';

                DB::table('notifications')->insert([
                    'id' => Str::uuid()->toString(),
                    'type' => 'App\Notifications\SystemNotification',
                    'notifiable_type' => 'App\Models\User',
                    'notifiable_id' => $profUserId,
                    'data' => json_encode([
                        'title' => "📑 Cahier de Texte : Séance {$statusLabel}",
                        'message' => "Votre séance sur \"{$entry->chapter_title}\" ({$modName}) a été {$statusLabel} par le Chef de Département.",
                        'type' => 'system',
                        'action_url' => '/professor/voice-textbook',
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Textbook validation notification error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "La séance a été marquée comme {$validated['decision']} avec succès.",
            'data' => $entry->load(['module', 'group', 'validator']),
        ]);
    }
}
