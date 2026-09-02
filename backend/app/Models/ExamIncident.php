<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamIncident extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $fillable = [
        'exam_id', 'student_id', 'reported_by', 'type',
        'description', 'confiscated_items', 'status', 'hearing_date',
        'hearing_room', 'decision', 'sanction_scope',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
