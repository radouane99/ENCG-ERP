<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'academic_year_id',
        'group_id',
        'title',
        'description',
        'type',
        'file_path',
        'due_date',
        'max_score',
        'coefficient',
        'allow_late_submission',
        'is_published',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'allow_late_submission' => 'boolean',
        'is_published' => 'boolean',
        'max_score' => 'decimal:2',
        'coefficient' => 'decimal:2',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }
}
