<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'birth_date' => 'date',
        'bac_average' => 'float',
        'entrance_exam_score' => 'float',
        'selection_score' => 'float',
        'reviewed_at' => 'datetime',
    ];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(AdmissionCampaign::class, 'admission_campaign_id');
    }
}
