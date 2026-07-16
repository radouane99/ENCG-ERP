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
     * Fetch the digital student card for the authenticated student.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $card = StudentCard::where('student_id', $user->id)->first();

        // Fallback or mock behavior if no card exists yet (ensure backward compatibility/testing)
        if (! $card) {
            $academicYear = AcademicYear::where('is_current', true)->first()?->name ?? '2023-2024';
            $card = StudentCard::create([
                'student_id' => $user->id,
                'card_number' => 'ENCG-'.date('Y').'-'.str_pad($user->id, 5, '0', STR_PAD_LEFT),
                'qr_token' => Str::random(40),
                'academic_year' => $academicYear,
                'status' => 'active',
                'expires_at' => now()->addYears(3),
            ]);
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
            return response()->json([
                'success' => false,
                'message' => 'Cette carte est '.($card->status === 'revoked' ? 'révoquée.' : 'expirée.'),
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
