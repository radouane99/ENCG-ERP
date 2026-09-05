<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiliereQuota extends Model
{
    use HasFactory;

    protected $table = 'filiere_quotas';

    protected $fillable = [
        'filiere_id',
        'academic_year',
        'capacity',
        'min_score_required',
        'is_open',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'min_score_required' => 'float',
        'is_open' => 'boolean',
    ];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }
}
