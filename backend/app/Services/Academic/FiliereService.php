<?php

namespace App\Services\Academic;

use App\Models\Filiere;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FiliereService
{
    /**
     * Obtenir la liste de toutes les filières avec eager loading.
     */
    public function getAllFilieres(): Collection
    {
        return Filiere::with(['department'])->get();
    }

    /**
     * Map une collection de filières vers un format DTO pour l'API.
     */
    public function mapFiliereCollection(Collection $filieres): array
    {
        return $filieres->map(function ($filiere) {
            return [
                'id' => $filiere->id,
                'code' => $filiere->code,
                'name' => $filiere->name,
                'type' => $filiere->type ?? 'Formation Initiale',
                'coordinator' => $filiere->department ? $filiere->department->head_name : 'Non assigné',
                'students' => DB::table('student_pathways')->where('filiere_id', $filiere->id)->where('is_current', true)->count(),
                'active' => $filiere->is_active,
                'duration_years' => $filiere->duration_years,
                'department_id' => $filiere->department_id,
            ];
        })->toArray();
    }

    /**
     * Créer une nouvelle filière.
     */
    public function createFiliere(array $data, int $institutionId = 1): Filiere
    {
        $data['institution_id'] = $institutionId;
        
        return DB::transaction(function () use ($data) {
            return Filiere::create($data);
        });
    }

    /**
     * Mettre à jour une filière existante.
     */
    public function updateFiliere(Filiere $filiere, array $data): Filiere
    {
        $filiere->update($data);
        return $filiere;
    }
}
