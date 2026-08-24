<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Professor extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user?->first_name,
        );
    }

    protected function lastName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user?->last_name,
        );
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user?->email,
        );
    }

    protected function phone(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user?->phone,
        );
    }

    protected function cin(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->user?->cin,
        );
    }

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

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }
}
