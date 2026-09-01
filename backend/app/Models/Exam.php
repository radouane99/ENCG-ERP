<?php

namespace App\Models;

use App\Services\Academic\ExamSlotCatalog;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected static function booted(): void
    {
        static::saving(function (Exam $exam) {
            if (blank($exam->start_time)) {
                return;
            }

            $normalized = ExamSlotCatalog::normalizeForStorage((string) $exam->start_time);
            $exam->start_time = $normalized['start_time'];
            $exam->duration_minutes = $normalized['duration_minutes'];
        });
    }

    protected function casts(): array
    {
        return [
            'exam_date' => 'date',
            'duration_minutes' => 'integer',
            'grades_published' => 'boolean',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class, 'exam_session_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class, 'exam_session_id');
    }

    public function surveillances(): HasMany
    {
        return $this->hasMany(ExamSurveillance::class);
    }

    public function seatings(): HasMany
    {
        return $this->hasMany(ExamSeating::class);
    }

    // ✅ AJOUTÉ : Relation pour les convocations
    public function convocations(): HasMany
    {
        return $this->hasMany(Convocation::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(ExamIncident::class);
    }

    /**
     * Stable verification seal for official PVs. Never uses wall-clock time:
     * unlocked exams fingerprint created_at; locked exams fingerprint locked_at.
     */
    public function documentSeal(): string
    {
        $fingerprint = $this->locked_at ?? $this->created_at ?? $this->getKey();

        return 'SHA256:ENCG-FES-'.$this->getKey().'-'.strtoupper(substr(md5($this->getKey().(string) $fingerprint), 0, 16));
    }

    /**
     * Horaire d'épreuve selon les créneaux officiels ENCG (2h + pause 15 min entre créneaux).
     */
    public function formattedTimeRange(): string
    {
        return ExamSlotCatalog::formattedRange((string) ($this->start_time ?? ''));
    }

    public function resolvedDurationMinutes(): int
    {
        return ExamSlotCatalog::durationMinutes((string) ($this->start_time ?? ''));
    }
}
