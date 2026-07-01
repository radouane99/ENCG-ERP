<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id', 'type', 'subject', 'message', 'status', 'admin_response', 'handled_by'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function handler()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
