<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacationPayment extends Model implements HasMedia
{
    use InteractsWithMedia;
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
        'total_hours' => 'float',
        'hourly_rate' => 'float',
        'gross_amount' => 'float',
        'tax_deduction' => 'float',
        'cnss_deduction' => 'float',
        'net_amount' => 'float',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(VacationContract::class, 'vacation_contract_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

