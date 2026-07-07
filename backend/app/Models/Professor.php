<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Professor extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'institution_id',
        'user_id',
        'department_id',
        'employee_number',
        'cin',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'email',
        'phone',
        'grade',
        'specialty',
        'contract_type',
        'hire_date',
        'photo_path',
        'is_active',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }


    public function vacationContracts(): HasMany
    {
        return $this->hasMany(VacationContract::class);
    }
}
