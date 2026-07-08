<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Internship extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id', 'student_id', 'academic_year_id', 'type', 'company_name', 
        'company_address', 'company_city', 'supervisor_name', 'supervisor_email', 
        'supervisor_phone', 'position_title', 'start_date', 'end_date', 
        'agreement_file_path', 'status', 'professor_supervisor_id'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => \App\Enums\InternshipStatus::class,
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
