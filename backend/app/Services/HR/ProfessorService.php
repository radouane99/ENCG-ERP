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
        $query = Professor::with(['department', 'user']);

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('employee_number', 'like', "%$s%")
                  ->orWhereHas('user', function($uq) use ($s) {
                      if (DB::connection()->getDriverName() === 'sqlite') {
                          $uq->where('first_name', 'like', "%$s%")
                             ->orWhere('last_name', 'like', "%$s%")
                             ->orWhere('email', 'like', "%$s%");
                      } else {
                          $uq->whereRaw('MATCH(first_name, last_name, email) AGAINST (? IN BOOLEAN MODE)', [$s . '*']);
                      }
                  });
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
                'first_name' => $p->first_name ?? $p->user?->first_name,
                'last_name' => $p->last_name ?? $p->user?->last_name,
                'email' => $p->email ?? $p->user?->email,
                'phone' => $p->phone ?? $p->user?->phone,
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
            // Create user first
            $user = \App\Models\User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'name' => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'cin' => $data['cin'] ?? null,
                'password' => bcrypt('password'), // default password
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Clean up professor data
            unset($data['first_name'], $data['last_name'], $data['email'], $data['phone'], $data['cin']);

            $year = date('Y');
            
            // Get the maximum employee number for this year to avoid duplicates on soft deletes
            $lastProf = Professor::withTrashed()
                ->where('employee_number', 'LIKE', "PROF-$year-%")
                ->orderBy('employee_number', 'desc')
                ->first();
                
            $count = 1;
            if ($lastProf) {
                $lastNumber = intval(substr($lastProf->employee_number, -3));
                $count = $lastNumber + 1;
            }
            
            $data['employee_number'] = 'PROF-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            $data['institution_id'] = $institutionId;
            $data['user_id'] = $user->id;

            return Professor::create($data);
        });
    }

    /**
     * Update existing professor
     */
    public function updateProfessor(Professor $professor, array $data): Professor
    {
        return DB::transaction(function () use ($professor, $data) {
            // Extract user fields
            $userData = [];
            foreach (['first_name', 'last_name', 'email', 'phone', 'cin', 'is_active'] as $field) {
                if (array_key_exists($field, $data)) {
                    $userData[$field] = $data[$field];
                    unset($data[$field]);
                }
            }

            if (isset($userData['first_name']) || isset($userData['last_name'])) {
                $firstName = $userData['first_name'] ?? $professor->first_name;
                $lastName = $userData['last_name'] ?? $professor->last_name;
                $userData['name'] = trim($firstName . ' ' . $lastName);
            }

            if (!empty($userData)) {
                $professor->user()->update($userData);
            }

            if (!empty($data)) {
                $professor->update($data);
            }
            
            return $professor->refresh();
        });
    }
}
