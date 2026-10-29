<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdmissionCampaign extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $attributes = ['entry_route' => 'tafem', 'entry_semester' => 1];

    protected function casts(): array
    {
        return [
            'entry_semester' => 'integer',
            'open_date' => 'date',
            'close_date' => 'date',
            'result_date' => 'date',
            'requires_entrance_exam' => 'boolean',
        ];
    }

    public function registrationState(): string
    {
        if ($this->status !== 'open') {
            return $this->status === 'draft' ? 'draft' : 'closed';
        }
        $today = now(config('admissions.timezone', 'Africa/Casablanca'))->toDateString();
        if (! $this->open_date || ! $this->close_date) {
            return 'closed';
        }
        if ($today < $this->open_date->toDateString()) {
            return 'upcoming';
        }

        return $today <= $this->close_date->toDateString() ? 'open' : 'closed';
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
