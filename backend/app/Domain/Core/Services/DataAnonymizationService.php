<?php

namespace App\Domain\Core\Services;

use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class DataAnonymizationService
{
    /**
     * Anonymize a user to comply with Law 09-08 (Right to be Forgotten).
     * Statistical data (grades, attendance) is retained; PII is removed.
     */
    public function anonymizeUser(int|string $userId): bool
    {
        return DB::transaction(function () use ($userId) {
            $user = User::findOrFail($userId);

            $hash = substr(hash('sha256', uniqid('anon', true)), 0, 10);

            $payload = [
                'name' => "Anonymized User_{$hash}",
                'first_name' => 'Anonymized',
                'last_name' => "User_{$hash}",
                'email' => "anonymized_{$hash}@encg-fes.ac.ma.deleted",
                'phone' => null,
                'is_active' => false,
            ];

            if (Schema::hasColumn('users', 'cin')) {
                $payload['cin'] = null;
            }
            if (Schema::hasColumn('users', 'birth_date')) {
                $payload['birth_date'] = null;
            }

            $user->update($payload);

            $student = Student::where('user_id', $user->id)->first();
            if ($student && Schema::hasTable('applications')) {
                $appUpdate = [];
                if (Schema::hasColumn('applications', 'cin')) {
                    $appUpdate['cin'] = null;
                }
                if (Schema::hasColumn('applications', 'cne')) {
                    $appUpdate['cne'] = null;
                }
                if (Schema::hasColumn('applications', 'phone')) {
                    $appUpdate['phone'] = null;
                }
                if (Schema::hasColumn('applications', 'email')) {
                    $appUpdate['email'] = "anonymized_{$hash}@deleted";
                }
                if (Schema::hasColumn('applications', 'first_name')) {
                    $appUpdate['first_name'] = 'Anonymized';
                }
                if (Schema::hasColumn('applications', 'last_name')) {
                    $appUpdate['last_name'] = "User_{$hash}";
                }

                if ($appUpdate !== []) {
                    $query = DB::table('applications');
                    if (Schema::hasColumn('applications', 'student_id')) {
                        $query->where('student_id', $student->id);
                    } elseif (Schema::hasColumn('applications', 'cne') && $student->cne) {
                        $query->where('cne', $student->cne);
                    }
                    $query->update($appUpdate);
                }
            }

            Log::info("User ID {$userId} has been successfully anonymized in compliance with Law 09-08.");

            return true;
        });
    }
}
