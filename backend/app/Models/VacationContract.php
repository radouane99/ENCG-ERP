<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VacationContract extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'institution_id',
        'user_id',
        'cin',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'email',
        'phone',
        'rib_number',
        'bank_name',
        'external_institution',
        'qualification',
        'academic_year_id',
        'module_id',
        'group_id',
        'session_type',
        'agreed_hours',
        'hourly_rate',
        'status',
        'contract_start',
        'contract_end',
        'contract_file_path',
    ];

    protected $casts = [
        'hourly_rate' => 'float',
        'contract_start' => 'date',
        'contract_end' => 'date',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(VacationSession::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(VacationPayment::class);
    }
}
