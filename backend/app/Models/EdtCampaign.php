<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EdtCampaign extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'allow_saturday' => 'boolean',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ScheduleVersion::class, 'edt_campaign_id');
    }

    public function isOpen(): bool
    {
        return strtoupper((string) $this->status) === 'OPEN';
    }
}
