<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_name',
        'room_id',
        'booked_by',
        'purpose',
        'start_time',
        'end_time',
        'status',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function booker()
    {
        return $this->belongsTo(User::class, 'booked_by');
    }

    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id');
    }
}
