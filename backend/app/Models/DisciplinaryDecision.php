<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DisciplinaryDecision extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'decision_date' => 'date',
        'is_appealed' => 'boolean',
    ];
    }

    public function disciplinaryCase()
    {
        return $this->belongsTo(DisciplinaryCase::class);
    }

    public function decidedBy()
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
