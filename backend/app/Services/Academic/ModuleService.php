<?php

namespace App\Services\Academic;

use App\Models\Module;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ModuleService
{
    /**
     * Obtenir la liste de tous les modules avec eager loading.
     */
    public function getAllModules(): Collection
    {
        return Module::with(['filiere'])->get();
    }

    /**
     * Map une collection de modules vers un format DTO pour l'API.
     */
    public function mapModuleCollection(Collection $modules): array
    {
        return $modules->map(function ($module) {
            return [
                'id' => $module->id,
                'code' => $module->code,
                'name' => $module->name,
                'semester' => 'S' . $module->semester_number,
                'coefficient' => $module->coefficient,
                'filiere' => $module->filiere ? $module->filiere->code : 'TC',
                'professor' => 'Non assigné', // Placeholder pour la Phase 3
                'studentsCount' => DB::table('student_pathways')->where('filiere_id', $module->filiere_id)->where('is_current', true)->count(),
                'active' => $module->is_active,
                'filiere_id' => $module->filiere_id,
                'semester_number' => $module->semester_number,
                'credit_hours' => $module->credit_hours,
            ];
        })->toArray();
    }

    /**
     * Créer un nouveau module.
     */
    public function createModule(array $data, int $institutionId = 1): Module
    {
        $data['institution_id'] = $institutionId;

        return DB::transaction(function () use ($data) {
            return Module::create($data);
        });
    }

    /**
     * Mettre à jour un module existant.
     */
    public function updateModule(Module $module, array $data): Module
    {
        $module->update($data);
        return $module;
    }
}
