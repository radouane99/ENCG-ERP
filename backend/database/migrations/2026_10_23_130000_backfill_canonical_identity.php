<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('students')->whereNotNull('user_id')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $student) {
                $user = DB::table('users')->where('id', $student->user_id)->first();
                if (! $user) {
                    continue;
                }
                $values = [];
                foreach (['birth_date', 'address', 'city', 'cin'] as $field) {
                    $value = $student->{$field} ?? null;
                    if ($user->{$field} !== null || $value === null || $value === '') {
                        continue;
                    }
                    if ($field === 'birth_date') {
                        $date = DateTimeImmutable::createFromFormat('!Y-m-d', (string) $value);
                        if (! $date || $date->format('Y-m-d') !== (string) $value) {
                            $this->issue($student->id, 'invalid_legacy_birth_date');

                            continue;
                        }
                    }
                    if ($field === 'cin' && DB::table('users')->where('cin', $value)->where('id', '!=', $user->id)->exists()) {
                        $this->issue($student->id, 'duplicate_legacy_cin');

                        continue;
                    }
                    $values[$field] = $value;
                }
                if ($values) {
                    DB::table('users')->where('id', $user->id)->update($values);
                }
            }
        });
    }

    private function issue(int $id, string $reason): void
    {
        DB::table('data_integrity_issues')->insertOrIgnore(['entity' => 'students', 'entity_id' => $id, 'reason' => $reason, 'created_at' => now(), 'updated_at' => now()]);
    }

    public function down(): void {}
};
