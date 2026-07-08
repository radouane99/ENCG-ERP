<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'options' => 'array',
        'points' => 'decimal:2',
    ];
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }
}
