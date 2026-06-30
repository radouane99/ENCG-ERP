<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'academic_year_id',
        'filiere_id',
        'group_id',
        'semester_number',
        'status',
        'registration_type',
        'tuition_amount',
        'payment_status',
        'academic_validated_at',
        'academic_validated_by',
        'admin_validated_at',
        'admin_validated_by',
    ];

    protected $casts = [
        'tuition_amount' => 'float',
        'academic_validated_at' => 'datetime',
        'admin_validated_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
