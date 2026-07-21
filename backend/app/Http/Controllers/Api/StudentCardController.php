<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\StudentCard;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StudentCardController extends Controller
{
    /**
     * Display a listing of the student cards with search and filters (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::whereHas('student')->with(['studentCard', 'student.latestPathway.group', 'student.latestPathway.filiere', 'institution']);

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'not_generated') {
                $query->whereDoesntHave('studentCard');
            } else {
                $query->whereHas('studentCard', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            }
        }

        // Filter by group_id or filiere_id
        if ($request->filled('group_id') || $request->filled('filiere_id')) {
            $query->whereHas('student.latestPathway', function ($q) use ($request) {
                if ($request->filled('group_id')) {
                    $q->where('group_id', $request->input('group_id'));
                }
                if ($request->filled('filiere_id')) {
                    $q->where('filiere_id', $request->input('filiere_id'));
                }
            });
        }

        // Search by student name, CNE, card_number
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('cin', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('cne', 'like', "%{$search}%");
                    })
                    ->orWhereHas('studentCard', function ($sq) use ($search) {
                        $sq->where('card_number', 'like', "%{$search}%");
                    });
            });
        }

        $users = $query->paginate($request->input('per_page', 15));

        // Format to match show schema
        $items = collect($users->items())->map(function ($user) {
            $card = $user->studentCard;
            $studentProfile = $user->student;
            $pathway = $studentProfile?->latestPathway;

            return [
                'id' => $card?->id ?? null,
                'student_id' => $user->id,
                'card_number' => $card?->card_number ?? 'Non générée',
                'qr_token' => $card?->qr_token ?? null,
                'status' => $card?->status ?? 'not_generated',
                'expires_at' => $card?->expires_at ?? null,
                'academic_year' => $card?->academic_year ?? null,
                'photo_url' => $card?->photo_url ? asset('storage/'.$card->photo_url) : null,
                'student' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'cne' => $studentProfile?->cne ?? 'N/A',
                    'cin' => $user->cin ?? 'N/A',
                    'filiere' => $pathway?->filiere?->name ?? 'Non assignée',
                    'group' => $pathway?->group?->name ?? 'Non assigné',
                ],
                'institution' => [
                    'name' => $user->institution->name ?? 'ENCG Fès',
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Fetch the digital student card for the authenticated student.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $card = StudentCard::where('student_id', $user->id)->first();

        if (! $card) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune carte étudiant générée pour ce profil.',
            ], 404);
        }

        $studentProfile = $user->student;
        $pathway = $studentProfile?->latestPathway;

        return response()->json([
            'success' => true,
            'data' => [
                'card_number' => $card->card_number,
                'qr_token' => $card->qr_token,
                'status' => $card->status,
                'expires_at' => $card->expires_at,
                'academic_year' => $card->academic_year,
                'photo_url' => $card->photo_url ? asset('storage/'.$card->photo_url) : null,
                'student' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    'cne' => $studentProfile?->cne ?? 'N/A',
                    'cin' => $user->cin ?? 'N/A',
                    'filiere' => $pathway?->filiere?->name ?? 'Non assignée',
                    'group' => $pathway?->group?->name ?? 'Non assigné',
                ],
                'institution' => [
                    'name' => $user->institution->name ?? 'ENCG Fès',
                ],
            ],
        ]);
    }

    /**
     * Preview a digital student card before persisting it.
     */
    public function preview(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('admin') || $user->hasRole('super-admin') || $user->hasRole('super_admin') || $user->hasRole('institution-admin');

        $rules = [
            'student_id' => $isAdmin ? 'required|exists:users,id' : 'nullable|exists:users,id',
            'photo' => 'required|image|mimes:jpeg,png|max:2048|dimensions:min_width=300,min_height=300,max_width=1200,max_height=1500',
            'expires_at' => $isAdmin ? 'nullable|date|after:now' : 'nullable',
        ];

        $request->validate($rules);

        $targetUserId = $isAdmin ? $request->input('student_id') : $user->id;
        $targetUser = User::with(['student.latestPathway.group', 'student.latestPathway.filiere', 'institution'])->findOrFail($targetUserId);
        $student = $targetUser->student;

        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => 'L\'utilisateur sélectionné n\'est pas un étudiant ou n\'a pas de profil étudiant.',
            ], 422);
        }

        // Calculate Expiration
        if ($isAdmin && $request->filled('expires_at')) {
            $expiresAt = Carbon::parse($request->input('expires_at'));
        } else {
            $semester = $student->latestPathway?->current_semester ?? 1;
            $years = match (true) {
                $semester <= 2 => 5,
                $semester <= 4 => 3,
                $semester <= 6 => 2,
                $semester <= 8 => 2,
                default => 1,
            };
            $expiresAt = now()->addYears($years);
        }

        // Save to preview directory temporarily
        $tempPath = $request->file('photo')->store('student_cards/previews', 'public');
        $academicYear = AcademicYear::where('is_current', true)->first()?->name ?? date('Y').'-'.(date('Y') + 1);

        return response()->json([
            'success' => true,
            'data' => [
                'card_number' => 'ENCG-'.date('Y').'-'.str_pad($targetUser->id, 5, '0', STR_PAD_LEFT),
                'qr_token' => Str::random(40),
                'status' => 'active',
                'expires_at' => $expiresAt->toIso8601String(),
                'academic_year' => $academicYear,
                'photo_url' => asset('storage/'.$tempPath),
                'temp_path' => $tempPath,
                'student' => [
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'cne' => $student->cne ?? 'N/A',
                    'cin' => $targetUser->cin ?? 'N/A',
                    'filiere' => $student->latestPathway?->filiere?->name ?? 'Non assignée',
                    'group' => $student->latestPathway?->group?->name ?? 'Non assigné',
                ],
                'institution' => [
                    'name' => $targetUser->institution->name ?? 'ENCG Fès',
                ],
            ],
        ]);
    }

    /**
     * Create or update a student card.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('admin') || $user->hasRole('super-admin') || $user->hasRole('super_admin') || $user->hasRole('institution-admin');

        $rules = [
            'student_id' => $isAdmin ? 'required|exists:users,id' : 'nullable|exists:users,id',
            'expires_at' => $isAdmin ? 'nullable|date|after:now' : 'nullable',
        ];

        if ($request->has('temp_path')) {
            $rules['temp_path'] = 'required|string';
        } else {
            $rules['photo'] = 'required|image|mimes:jpeg,png|max:2048|dimensions:min_width=300,min_height=300,max_width=1200,max_height=1500';
        }

        $request->validate($rules);

        $targetUserId = $isAdmin ? $request->input('student_id') : $user->id;
        $targetUser = User::with(['student.latestPathway.group', 'student.latestPathway.filiere', 'institution'])->findOrFail($targetUserId);
        $student = $targetUser->student;

        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => 'L\'utilisateur sélectionné n\'est pas un étudiant ou n\'a pas de profil étudiant.',
            ], 422);
        }

        // Calculate Expiration
        if ($isAdmin && $request->filled('expires_at')) {
            $expiresAt = Carbon::parse($request->input('expires_at'));
        } else {
            $semester = $student->latestPathway?->current_semester ?? 1;
            $years = match (true) {
                $semester <= 2 => 5,
                $semester <= 4 => 3,
                $semester <= 6 => 2,
                $semester <= 8 => 2,
                default => 1,
            };
            $expiresAt = now()->addYears($years);
        }

        // Get Academic Year
        $academicYear = AcademicYear::where('is_current', true)->first()?->name ?? date('Y').'-'.(date('Y') + 1);

        // Store photo
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('student_cards/photos', 'public');
        } elseif ($request->has('temp_path')) {
            $tempPath = $request->input('temp_path');
            if (Str::startsWith($tempPath, 'student_cards/previews/') && ! Str::contains($tempPath, '..')) {
                if (Storage::disk('public')->exists($tempPath)) {
                    $fileName = basename($tempPath);
                    $newPath = 'student_cards/photos/'.$fileName;
                    Storage::disk('public')->move($tempPath, $newPath);
                    $photoPath = $newPath;
                }
            }
        }

        if (! $photoPath) {
            return response()->json([
                'success' => false,
                'message' => 'Fichier photo introuvable ou invalide.',
            ], 422);
        }

        // Find or create card
        $card = StudentCard::where('student_id', $targetUserId)->first();

        if ($card) {
            // Delete old photo if it exists
            if ($card->photo_url && Storage::disk('public')->exists($card->photo_url)) {
                Storage::disk('public')->delete($card->photo_url);
            }

            $card->update([
                'photo_url' => $photoPath,
                'expires_at' => $expiresAt,
                'academic_year' => $academicYear,
                'status' => 'active',
                'qr_token' => Str::random(40), // rotate token on renewal/re-creation
            ]);
        } else {
            $card = StudentCard::create([
                'student_id' => $targetUserId,
                'card_number' => 'ENCG-'.date('Y').'-'.str_pad($targetUserId, 5, '0', STR_PAD_LEFT),
                'qr_token' => Str::random(40),
                'academic_year' => $academicYear,
                'photo_url' => $photoPath,
                'status' => 'active',
                'expires_at' => $expiresAt,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Carte étudiant générée avec succès.',
            'data' => [
                'card_number' => $card->card_number,
                'qr_token' => $card->qr_token,
                'status' => $card->status,
                'expires_at' => $card->expires_at,
                'academic_year' => $card->academic_year,
                'photo_url' => asset('storage/'.$card->photo_url),
                'student' => [
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'cne' => $student->cne ?? 'N/A',
                    'cin' => $targetUser->cin ?? 'N/A',
                    'filiere' => $student->latestPathway?->filiere?->name ?? 'Non assignée',
                    'group' => $student->latestPathway?->group?->name ?? 'Non assigné',
                ],
                'institution' => [
                    'name' => $targetUser->institution->name ?? 'ENCG Fès',
                ],
            ],
        ]);
    }

    /**
     * Update the status of a student card (admin only).
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:active,suspended,lost,stolen,revoked,expired',
        ]);

        $card = StudentCard::findOrFail($id);
        $card->update([
            'status' => $request->input('status'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Le statut de la carte d\'étudiant a été mis à jour avec succès.',
            'data' => $card,
        ]);
    }

    /**
     * Bulk generate student cards (admin only).
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:users,id',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $studentIds = $request->input('student_ids');
        $academicYear = AcademicYear::where('is_current', true)->first()?->name ?? date('Y').'-'.(date('Y') + 1);
        $generatedCount = 0;

        foreach ($studentIds as $studentId) {
            $existingCard = StudentCard::where('student_id', $studentId)->first();
            if ($existingCard) {
                continue;
            }

            $user = User::with(['student.latestPathway.group', 'student.latestPathway.filiere'])->find($studentId);
            if (! $user || ! $user->student) {
                continue;
            }

            $photoPath = $user->photo_path ?? $user->avatar_path ?? null;

            if (! $photoPath) {
                $photoPath = 'student_cards/photos/default_avatar.png';
                if (! Storage::disk('public')->exists($photoPath)) {
                    Storage::disk('public')->put($photoPath, '');
                }
            }

            // Expiration Date calculation
            if ($request->filled('expires_at')) {
                $expiresAt = Carbon::parse($request->input('expires_at'));
            } else {
                $semester = $user->student->latestPathway?->current_semester ?? 1;
                $years = match (true) {
                    $semester <= 2 => 5,
                    $semester <= 4 => 3,
                    $semester <= 6 => 2,
                    $semester <= 8 => 2,
                    default => 1,
                };
                $expiresAt = now()->addYears($years);
            }

            StudentCard::create([
                'student_id' => $studentId,
                'card_number' => 'ENCG-'.date('Y').'-'.str_pad($studentId, 5, '0', STR_PAD_LEFT),
                'qr_token' => Str::random(40),
                'academic_year' => $academicYear,
                'photo_url' => $photoPath,
                'status' => 'active',
                'expires_at' => $expiresAt,
            ]);

            $generatedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "{$generatedCount} cartes d'étudiants ont été générées et activées avec succès.",
        ]);
    }

    /**
     * Public API endpoint to verify a student card using its QR token.
     */
    public function verify(Request $request, string $token): JsonResponse
    {
        $card = StudentCard::with(['student.institution'])->where('qr_token', $token)->first();

        if (! $card) {
            return response()->json([
                'success' => false,
                'message' => 'Carte introuvable ou invalide.',
            ], 404);
        }

        if ($card->status !== 'active' || $card->expires_at->isPast()) {
            $statusText = match ($card->status) {
                'suspended' => 'suspendue.',
                'lost' => 'déclarée perdue.',
                'stolen' => 'déclarée volée.',
                'revoked' => 'révoquée.',
                default => 'expirée.',
            };
            if ($card->expires_at->isPast()) {
                $statusText = 'expirée.';
            }

            return response()->json([
                'success' => false,
                'status' => $card->status,
                'message' => 'Cette carte est '.$statusText,
            ], 403);
        }

        $studentProfile = $card->student->student;

        return response()->json([
            'success' => true,
            'data' => [
                'card_number' => $card->card_number,
                'academic_year' => $card->academic_year,
                'student_name' => $card->student->name,
                'photo_url' => $card->photo_url ? asset('storage/'.$card->photo_url) : null,
                'cne' => $studentProfile?->cne ?? 'N/A',
                'cin' => $card->student->cin ?? 'N/A',
                'institution' => $card->student->institution->name ?? 'ENCG Fès',
                'status' => 'Valide',
                'verified_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
