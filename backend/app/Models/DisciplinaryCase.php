<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DisciplinaryCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id', 'student_id', 'case_number', 'infraction_type',
        'description', 'incident_date', 'reported_by_name', 'status', 'student_statement'
    ];

    protected $casts = [
        'incident_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function institution()
    {
        return $this->belongsTo(Institution::class);
    }

    public function decision()
    {
        return $this->hasOne(DisciplinaryDecision::class);
    }
}
