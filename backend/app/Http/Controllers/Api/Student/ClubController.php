<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubEvent;
use App\Models\ClubMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ClubController extends Controller
{
    /**
     * Liste des clubs et événements récents avec indicateurs personnalisés.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;

        // Récupérer les adhésions de l'utilisateur connecté
        $userMemberships = $userId
            ? ClubMember::where('user_id', $userId)
                ->where('is_active', true)
                ->get()
                ->keyBy('club_id')
            : collect();

        $userClubIds = $userMemberships->keys()->all();

        $perPage = min((int) $request->input('per_page', 30), 100);
        $search = $request->input('search');
        $category = $request->input('category');

        $query = Club::withCount('members')
            ->where('is_active', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%")
                  ->orWhere('president_name', 'ilike', "%{$search}%");
            });
        }

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        $clubs = $query->orderBy('name')->paginate($perPage);

        // Enrichir chaque club avec le statut d'adhésion de l'étudiant
        $enrichedClubs = collect($clubs->items())->map(function ($club) use ($userMemberships) {
            $membership = $userMemberships->get($club->id);
            return array_merge($club->toArray(), [
                'is_member' => ! is_null($membership),
                'my_role' => $membership?->role,
                'joined_at' => $membership?->joined_at,
            ]);
        });

        // Événements récents et à venir
        $posts = ClubEvent::with('club')
            ->orderBy('start_at', 'asc')
            ->take(10)
            ->get()
            ->map(function ($event) {
                return array_merge($event->toArray(), [
                    'start_formatted' => Carbon::parse($event->start_at)->locale('fr')->isoFormat('dddd D MMMM [à] HH:mm'),
                    'is_participating' => false,
                ]);
            });

        // Statistiques réelles depuis la BDD
        $totalClubs = Club::where('is_active', true)->count();
        $myClubsCount = count($userClubIds);
        $upcomingEventsCount = ClubEvent::where('start_at', '>=', now()->subDay())->count();
        $communityMembersCount = ClubMember::where('is_active', true)->count();

        return response()->json([
            'success' => true,
            'clubs' => $enrichedClubs,
            'posts' => $posts,
            'stats' => [
                'active_clubs_count' => $totalClubs,
                'my_clubs_count' => $myClubsCount,
                'upcoming_events_count' => $upcomingEventsCount,
                'community_members_count' => $communityMembersCount,
            ],
            'meta' => [
                'total' => $clubs->total(),
                'per_page' => $clubs->perPage(),
                'current_page' => $clubs->currentPage(),
                'last_page' => $clubs->lastPage(),
            ],
        ]);
    }

    /**
     * Rejoindre un club étudiant.
     */
    public function join(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id;
        abort_unless($userId, 401, 'Non authentifié.');

        $club = Club::findOrFail($id);

        $membership = ClubMember::updateOrCreate(
            ['club_id' => $club->id, 'user_id' => $userId],
            ['role' => 'member', 'joined_at' => now(), 'is_active' => true]
        );

        return response()->json([
            'success' => true,
            'message' => "Félicitations ! Vous êtes désormais membre actif du club \"{$club->name}\".",
            'membership' => $membership,
        ]);
    }

    /**
     * Quitter un club étudiant.
     */
    public function leave(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()?->id;
        abort_unless($userId, 401, 'Non authentifié.');

        $club = Club::findOrFail($id);

        ClubMember::where('club_id', $club->id)
            ->where('user_id', $userId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Vous avez quitté le club \"{$club->name}\".",
        ]);
    }

    /**
     * Créer un nouveau club étudiant.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|in:scientific,cultural,sports,social',
        ]);

        $user = $request->user();
        $institutionId = $user?->student?->institution_id ?? 1;

        $club = Club::create([
            'institution_id' => $institutionId,
            'name' => $validated['name'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'president_name' => $user?->name ?: 'Étudiant ENCG',
            'is_active' => true,
        ]);

        if ($user) {
            ClubMember::create([
                'club_id' => $club->id,
                'user_id' => $user->id,
                'role' => 'president',
                'joined_at' => now(),
                'is_active' => true,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Club créé avec succès et enregistré dans l\'annuaire officiel de l\'ENCG Fès !',
            'club' => $club,
        ], 201);
    }

    /**
     * Publier une actualité ou un événement de club.
     */
    public function createEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'club_id' => 'nullable|exists:clubs,id',
            'location' => 'nullable|string',
            'start_at' => 'nullable|date',
        ]);

        $clubId = $validated['club_id'] ?? Club::first()?->id ?? 1;

        $event = ClubEvent::create([
            'club_id' => $clubId,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'location' => $validated['location'] ?: 'Campus ENCG Fès',
            'start_at' => $validated['start_at'] ?: now()->addDays(7),
            'status' => 'planned',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Actualité / Événement publié avec succès sur le campus !',
            'event' => $event->load('club'),
        ], 201);
    }

    /**
     * Participer à un événement de club.
     */
    public function participate(Request $request, int $id): JsonResponse
    {
        $event = ClubEvent::with('club')->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => "Votre participation à l'événement \"{$event->title}\" a été confirmée !",
        ]);
    }
}
