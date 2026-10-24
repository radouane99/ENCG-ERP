<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentGraduation extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['finalized_at' => 'datetime', 'terminal_semester' => 'integer'];
    }
}
