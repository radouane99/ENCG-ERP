<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class AcademicProject extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'institution_id',
        'academic_year_id',
        'student_id',
        'type', // 'internship' or 'final_project'
        'title',
        'title_ar',
        'description',
        'company_name',
        'company_address',
        'company_city',
        'supervisor_name',
        'supervisor_email',
        'supervisor_phone',
        'position_title',
        'start_date',
        'end_date',
        'status',
        'professor_supervisor_id',
        'metadata', // JSON for specific paths like 'agreement_file_path', 'report_path'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'metadata' => 'array',
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

    public function professorSupervisor(): BelongsTo
    {
        return $this->belongsTo(Professor::class, 'professor_supervisor_id');
    }
}
