<?php

namespace App\Models;

use App\Traits\OptimisticLocking;
use Illuminate\Database\Eloquent\Model;

class GradeRectification extends Model
{
    use OptimisticLocking;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'approved_at' => 'datetime'];
    }
}
