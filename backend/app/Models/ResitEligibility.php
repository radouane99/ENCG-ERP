<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResitEligibility extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'module_id',
        'academic_year_id',
        'semester_id',
        'reason', // justified_absence, failed_ordinary
        'is_eligible',
    ];

    protected $casts = [
        'is_eligible' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }
}
