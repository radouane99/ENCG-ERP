<?php

namespace App\Domain\Core\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DataAnonymizationService
{
    /**
     * Anonymize a user to comply with Law 09-08 (Right to be Forgotten).
     * This retains statistical data (e.g., grades, attendance) but removes PII.
     *
     * @param int $userId
     * @return bool
     */
    public function anonymizeUser(int $userId): bool
    {
        return DB::transaction(function () use ($userId) {
            $user = User::findOrFail($userId);
            
            // Random hash to ensure uniqueness but break identity
            $hash = substr(hash('sha256', uniqid('anon', true)), 0, 10);
            
            $user->update([
                'first_name' => 'Anonymized',
                'last_name' => "User_{$hash}",
                'email' => "anonymized_{$hash}@encg-fes.ac.ma.deleted",
                'phone' => null,
                'cin' => null,
                'cne' => null,
                'birth_date' => null,
                'is_active' => false,
            ]);

            // If user is a student, we might need to clear personal files/documents
            if ($user->hasRole('student')) {
                DB::table('applications')->where('student_id', $userId)->update([
                    'cin' => null,
                    'cne' => null,
                    'phone' => null,
                    'email' => "anonymized_{$hash}@deleted",
                    'first_name' => 'Anonymized',
                    'last_name' => "User_{$hash}",
                ]);
            }

            Log::info("User ID {$userId} has been successfully anonymized in compliance with Law 09-08.");

            return true;
        });
    }
}
