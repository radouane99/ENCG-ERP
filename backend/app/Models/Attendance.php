<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendances';

    protected $fillable = [
        'attendance_session_id',
        'student_id',
        'scanned_at',
        'scanned_latitude',
        'scanned_longitude',
        'is_valid',
        'status',
        'is_justified',
        'notes',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'scanned_latitude' => 'decimal:8',
        'scanned_longitude' => 'decimal:8',
        'is_valid' => 'boolean',
        'is_justified' => 'boolean',
        'status' => \App\Enums\AttendanceStatus::class,
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
