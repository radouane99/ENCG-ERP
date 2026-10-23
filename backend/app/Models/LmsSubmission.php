<?php

namespace App\Models;

use App\Traits\OptimisticLocking;
use Illuminate\Database\Eloquent\Model;

class LmsSubmission extends Model
{
    use OptimisticLocking;

    protected $guarded = ['id'];

    protected $hidden = ['file_path'];

    protected function casts(): array
    {
        return ['submitted_at' => 'datetime'];
    }
}
