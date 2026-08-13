<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecommendationRequest extends Model
{
    use HasFactory;

    protected $table = 'recommendation_requests';

    protected $fillable = [
        'student_id',
        'professor_id',
        'purpose',
        'status',
        'ai_eligibility_score',
        'ai_recommendation_text',
        'delivery_method',
        'signed_at',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function professor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professor_id');
    }
}
