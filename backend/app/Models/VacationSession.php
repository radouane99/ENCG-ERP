<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacationSession extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'session_date' => 'date',
        'hours' => 'float',
        'validated_at' => 'datetime',
    ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(VacationContract::class, 'vacation_contract_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }
}
