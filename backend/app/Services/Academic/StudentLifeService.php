<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use App\Models\Club;
use Illuminate\Database\Eloquent\Collection;

class StudentLifeService
{
    /**
     * Get all clubs with eager loading of president and members.
     */
    public function getAllClubs(): Collection
    {
        return Club::with(['president', 'members'])
            ->latest()
            ->get();
    }

    /**
     * Create a new club (often starts as pending).
     */
    public function createClub(array $data): Club
    {
        return DB::transaction(function () use ($data) {
            return Club::create([
                'name'         => $data['name'],
                'description'  => $data['description'],
                'president_id' => $data['president_id'],
                'status'       => 'pending',
                'logo_url'     => $data['logo_url'] ?? null
            ]);
        });
    }

    /**
     * Update the status of a club (e.g. approve or reject).
     */
    public function updateClubStatus(int $clubId, string $status): Club
    {
        $validStatuses = ['active', 'inactive', 'pending', 'rejected'];

        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Statut de club invalide.");
        }

        return DB::transaction(function () use ($clubId, $status) {
            $club = Club::findOrFail($clubId);
            $club->status = $status;
            $club->save();

            return $club;
        });
    }
}
