<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpecialtyWish extends Model
{
    use HasFactory;

    protected $table = 'student_specialty_wishes';

    protected $fillable = [
        'student_id',
        'filiere_id',
        'preference_rank',
        'academic_year',
        'calculated_merit_score',
        'allocation_status',
        'waiting_list_rank',
        'allocated_at',
    ];

    protected $casts = [
        'preference_rank' => 'integer',
        'calculated_merit_score' => 'float',
        'waiting_list_rank' => 'integer',
        'allocated_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }
}
