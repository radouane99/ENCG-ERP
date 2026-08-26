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
            $originalEmail = $user->email;

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
            if (Schema::hasColumn('users', 'cne')) {
                $payload['cne'] = null;
            }
            if (Schema::hasColumn('users', 'birth_date')) {
                $payload['birth_date'] = null;
            }

            $student = Student::where('user_id', $user->id)->first();
            $originalCne = $student?->cne;

            $user->forceFill($payload)->save();

            if ($student) {
                $studentPayload = [];
                if (Schema::hasColumn('students', 'cne')) {
                    $studentPayload['cne'] = null;
                }
                if (Schema::hasColumn('students', 'cin')) {
                    $studentPayload['cin'] = null;
                }
                if ($studentPayload !== []) {
                    $student->update($studentPayload);
                }
            }

            if (Schema::hasTable('applications')) {
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
                    $scoped = false;
                    if ($student && Schema::hasColumn('applications', 'student_id')) {
                        $query->where('student_id', $student->id);
                        $scoped = true;
                    } elseif ($originalCne && Schema::hasColumn('applications', 'cne')) {
                        $query->where('cne', $originalCne);
                        $scoped = true;
                    } elseif ($originalEmail && Schema::hasColumn('applications', 'email')) {
                        $query->where('email', $originalEmail);
                        $scoped = true;
                    }

                    if ($scoped) {
                        $query->update($appUpdate);
                    } else {
                        Log::warning("Skipped application anonymization for user {$userId}: no safe identity filter.");
                    }
                }
            }

            Log::info("User ID {$userId} has been successfully anonymized in compliance with Law 09-08.");

            return true;
        });
    }
}
