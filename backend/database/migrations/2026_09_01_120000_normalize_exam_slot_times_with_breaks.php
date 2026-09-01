<?php

use App\Models\Exam;
use App\Services\Academic\ExamSlotCatalog;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Exam::query()
            ->whereNotNull('start_time')
            ->orderBy('id')
            ->each(function (Exam $exam) {
                $normalized = ExamSlotCatalog::normalizeForStorage((string) $exam->start_time);
                $currentStart = substr((string) $exam->start_time, 0, 5);
                $targetStart = substr($normalized['start_time'], 0, 5);

                if ($currentStart !== $targetStart || (int) $exam->duration_minutes !== $normalized['duration_minutes']) {
                    $exam->timestamps = false;
                    $exam->forceFill($normalized)->saveQuietly();
                }
            });
    }

    public function down(): void
    {
        // Non réversible : correction de données métier
    }
};
