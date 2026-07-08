<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinalProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'academic_year_id',
        'student_id',
        'title',
        'title_ar',
        'description',
        'type',
        'company_name',
        'company_city',
        'status',
        'report_path',
    ];

    protected $casts = [
        'status' => \App\Enums\FinalProjectStatus::class,
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
