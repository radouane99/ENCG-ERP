<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobOffer extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
        ];
    }
}
