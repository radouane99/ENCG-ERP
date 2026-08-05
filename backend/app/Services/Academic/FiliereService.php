<?php

namespace App\Services\Academic;

use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\StudentPathway;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FiliereService
{
    /**
     * Récupérer toutes les filières avec eager loading.
     */
    public function getAllFilieres(): Collection
    {
        return Filiere::with(['department', 'responsable'])
            ->withCount(['modules', 'groups'])
            ->get();
    }

    /**
     * Mapper une collection de filières en format DTO.
     */
    public function mapFiliereCollection(Collection $filieres): array
    {
        return $filieres->map(function ($filiere) {
            return [
                'id'               => $filiere->id,
                'code'             => $filiere->code,
                'name'             => $filiere->name,
                'type'             => $filiere->type ?? 'grande_ecole',
                'coordinator'      => $filiere->department->head_name ?? 'Non assigné',
                'responsable_id'   => $filiere->responsable_id,
                'responsable_name' => $filiere->responsable?->name ?? 'Non assigné',
                'students'         => StudentPathway::where('filiere_id', $filiere->id)->where('is_current', true)->count(),
                'active'           => $filiere->is_active,
                'duration_years'   => $filiere->duration_years,
                'department_id'    => $filiere->department_id,
                'groups_count'     => $filiere->groups_count ?? Group::where('filiere_id', $filiere->id)->count(),
                'modules_count'    => $filiere->modules_count ?? Module::where('filiere_id', $filiere->id)->count(),
            ];
        })->toArray();
    }

    /**
     * Créer une filière.
     */
    public function createFiliere(array $data, int $institutionId = 1): Filiere
    {
        $data['institution_id'] = $institutionId;

        return DB::transaction(fn() => Filiere::create($data));
    }

    /**
     * Mettre à jour une filière.
     */
    public function updateFiliere(Filiere $filiere, array $data): Filiere
    {
        $filiere->update($data);

        return $filiere;
    }
}