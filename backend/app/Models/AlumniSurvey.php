<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlumniSurvey extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'graduation_year',
        'employment_status',
        'company_name',
        'job_title',
        'starting_salary',
        'months_to_hire',
        'sector'
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
