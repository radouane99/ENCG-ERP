<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'admission_campaign_id',
        'reference_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'cin',
        'cne',
        'birth_date',
        'bac_mention',
        'bac_average',
        'bac_year',
        'bac_series',
        'status',
        'ranking',
        'entrance_exam_score',
        'selection_score',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'bac_average' => 'float',
        'entrance_exam_score' => 'float',
        'selection_score' => 'float',
        'reviewed_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdmissionCampaign::class, 'admission_campaign_id');
    }
}
