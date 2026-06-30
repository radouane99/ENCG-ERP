<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamSeating extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'student_id', 'room_id', 'seat_number', 'is_present', 'notes'
    ];

    public function exam() { return $this->belongsTo(Exam::class); }
    public function student() { return $this->belongsTo(Student::class); }
    public function room() { return $this->belongsTo(Room::class); }
}
