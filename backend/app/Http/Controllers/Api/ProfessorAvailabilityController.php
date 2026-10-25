<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Professor;
use App\Models\ProfessorAvailability;
use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfessorAvailabilityController extends Controller
{
    private const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    private function year(Request $r): AcademicYear
    {
        return AcademicYear::where('institution_id', $r->user()->institution_id)->where('is_current', true)->firstOrFail();
    }

    public function index(Request $r)
    {
        $year = $this->year($r);
        $availability = ProfessorAvailability::where('academic_year_id', $year->id)->whereNull('semester_id')->whereNull('day_of_week')->get()->keyBy('professor_id');
        $rows = Professor::with('user', 'department')->where('institution_id', $r->user()->institution_id)->get()->map(function ($p) use ($availability) {
            $a = $availability[$p->user_id] ?? null;
            $days = [];
            foreach ($a?->availability_data ?? [] as $day => $slots) {
                $labels = [];
                if ($slots['matin'] ?? false) {
                    $labels[] = 'matin';
                } if ($slots['apresMidi'] ?? false) {
                    $labels[] = 'après-midi';
                }
                if ($labels) {
                    $days[] = $day.' '.implode(' / ', $labels);
                }
            }

            return ['id' => $p->user_id, 'nom' => $p->user->name, 'email' => $p->user->email, 'dept' => $p->department?->name,
                'contrat' => $p->contract_type, 'statut' => $a?->status ?? 'Non soumis', 'creneaux' => $days ? implode(', ', $days) : 'Non renseigné', 'date' => $a?->updated_at?->format('d/m/Y H:i')];
        });

        return response()->json(['success' => true, 'data' => $rows]);
    }

    public function alert(Request $r)
    {
        abort_unless($r->user()->hasAnyRole(['super-admin', 'institution-admin', 'director', 'department-head', 'filiere-head']), 403);
        $data = $r->validate(['professor_ids' => 'required|array|min:1|max:100', 'professor_ids.*' => 'required|integer|distinct']);
        $users = User::where('institution_id', $r->user()->institution_id)->whereIn('id', $data['professor_ids'])->whereHas('professor')->get();
        abort_unless($users->count() === count($data['professor_ids']), 422, 'Sélection d’enseignants invalide.');
        foreach ($users as $user) {
            $user->notify(new SystemNotification('Disponibilités à renseigner', 'Merci de renseigner vos créneaux pour l’année '.$this->year($r)->label.'.', 'info', '/professor/availability-survey'));
        }

        return response()->json(['success' => true, 'message' => 'Demandes enregistrées dans les espaces enseignants.', 'sent_count' => $users->count()]);
    }

    public function myAvailability(Request $r)
    {
        abort_unless($r->user()->professor, 403, 'Profil enseignant requis.');
        $year = $this->year($r);
        $a = ProfessorAvailability::where('professor_id', $r->user()->id)->where('academic_year_id', $year->id)->whereNull('semester_id')->whereNull('day_of_week')->first();
        $slots = [];
        foreach (self::DAYS as $day) {
            $slots[$day] = ['matin' => false, 'apresMidi' => false];
        }

        return response()->json(['success' => true, 'data' => ['availability' => array_replace($slots, $a?->availability_data ?? []), 'status' => $a?->status ?? 'Non soumis', 'notes' => $a?->notes ?? '', 'updated_at' => $a?->updated_at?->toIso8601String(), 'session_name' => $year->label]]);
    }

    public function saveMyAvailability(Request $r)
    {
        abort_unless($r->user()->professor, 403, 'Profil enseignant requis.');
        $data = $r->validate(['availability' => 'required|array:Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi', 'availability.*' => 'required|array:matin,apresMidi',
            'availability.*.matin' => 'required|boolean', 'availability.*.apresMidi' => 'required|boolean', 'notes' => 'nullable|string|max:1000']);
        $count = 0;
        foreach ($data['availability'] as $slots) {
            $count += (int) $slots['matin'] + (int) $slots['apresMidi'];
        }
        $a = DB::transaction(function () use ($r, $data, $count) {
            User::whereKey($r->user()->id)->lockForUpdate()->firstOrFail();

            return ProfessorAvailability::updateOrCreate(['professor_id' => $r->user()->id, 'academic_year_id' => $this->year($r)->id, 'semester_id' => null, 'day_of_week' => null],
                ['availability_data' => $data['availability'], 'available_slots_count' => $count, 'notes' => $data['notes'] ?? null, 'status' => 'Soumis']);
        });

        return response()->json(['success' => true, 'message' => 'Disponibilités enregistrées.', 'data' => $a]);
    }
}
