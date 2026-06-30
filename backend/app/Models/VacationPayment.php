<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacationPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'vacation_contract_id',
        'reference_number',
        'payment_year',
        'payment_month',
        'total_hours',
        'hourly_rate',
        'gross_amount',
        'tax_deduction',
        'cnss_deduction',
        'net_amount',
        'status',
        'export_format',
        'export_file_path',
        'approved_at',
        'approved_by',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'total_hours' => 'float',
        'hourly_rate' => 'float',
        'gross_amount' => 'float',
        'tax_deduction' => 'float',
        'cnss_deduction' => 'float',
        'net_amount' => 'float',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

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
