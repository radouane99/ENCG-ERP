<?php

namespace App\Models;

class AttendanceRecord extends Attendance
{
    protected $table = 'attendances';

    // Exemple : Scopes spécifiques aux enregistrements de présence
    public function scopeValid($query)
    {
        return $query->where('is_valid', true);
    }
}
