<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdmissionCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'academic_year_id',
        'filiere_id',
        'name',
        'status',
        'open_date',
        'close_date',
        'result_date',
        'target_capacity',
        'accepted_count',
        'conditions',
        'requires_entrance_exam',
    ];

    protected $casts = [
        'open_date' => 'date',
        'close_date' => 'date',
        'result_date' => 'date',
        'requires_entrance_exam' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
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
