<?php

namespace App\Services\HR;

use App\Models\Professor;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ProfessorService
{
    /**
     * Get paginated professors with eager loading and search/filters
     */
    public function getFilteredProfessors(array $filters): Collection
    {
        $query = Professor::with('department');

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('employee_number', 'like', "%$s%");
            });
        }

        if (!empty($filters['contract_type'])) {
            $query->where('contract_type', $filters['contract_type']);
        }

        return $query->get();
    }

    /**
     * Map professor collection for API response
     */
    public function mapProfessorCollection(Collection $professors): array
    {
        return $professors->map(function ($p) {
            return [
                'id' => $p->id,
                'employee_number' => $p->employee_number,
                'first_name' => $p->first_name,
                'last_name' => $p->last_name,
                'email' => $p->email,
                'phone' => $p->phone,
                'grade' => $p->grade,
                'specialty' => $p->specialty,
                'contract_type' => $p->contract_type,
                'hire_date' => $p->hire_date?->format('Y-m-d'),
                'is_active' => $p->is_active,
                'department' => $p->department?->name ?? 'Non assigné',
                'department_id' => $p->department_id,
            ];
        })->toArray();
    }

    /**
     * Create a new professor and auto-generate employee_number
     */
    public function createProfessor(array $data, int $institutionId = 1): Professor
    {
        return DB::transaction(function () use ($data, $institutionId) {
            $year = date('Y');
            $count = Professor::whereYear('created_at', $year)->count() + 1;
            
            $data['employee_number'] = 'PROF-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            $data['institution_id'] = $institutionId;

            return Professor::create($data);
        });
    }

    /**
     * Update existing professor
     */
    public function updateProfessor(Professor $professor, array $data): Professor
    {
        $professor->update($data);
        return $professor;
    }
}
