<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamSurveillance extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'room_id', 'professor_id', 'role', 'has_attended'
    ];

    public function exam() { return $this->belongsTo(Exam::class); }
    public function room() { return $this->belongsTo(Room::class); }
    public function professor() { return $this->belongsTo(User::class, 'professor_id'); }
}
