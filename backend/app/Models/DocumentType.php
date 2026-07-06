<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'view_name',
        'fee_amount',
        'is_active',
    ];

    protected $casts = [
        'fee_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}
