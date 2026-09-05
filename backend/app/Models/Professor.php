<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

if (class_exists(Professor::class, false)) {
    return;
}

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

    protected function name(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->relationLoaded('user') && $this->user) {
                    return $this->user->name ?? trim(($this->user->first_name ?? '').' '.($this->user->last_name ?? ''));
                }
                $first = $this->attributes['first_name'] ?? '';
                $last = $this->attributes['last_name'] ?? '';
                $combined = trim($first.' '.$last);

                return $combined !== '' ? $combined : ($this->attributes['name'] ?? null);
            },
        );
    }

    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('user') ? $this->user?->first_name : ($this->attributes['first_name'] ?? null),
        );
    }

    protected function lastName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('user') ? $this->user?->last_name : ($this->attributes['last_name'] ?? null),
        );
    }

    protected function email(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('user') ? $this->user?->email : ($this->attributes['email'] ?? null),
        );
    }

    protected function phone(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('user') ? $this->user?->phone : ($this->attributes['phone'] ?? null),
        );
    }

    protected function cin(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->relationLoaded('user') ? $this->user?->cin : ($this->attributes['cin'] ?? null),
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

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Resolve by public UUID (preferred) or legacy numeric primary key.
     * PostgreSQL rejects non-UUID strings on uuid columns — never compare both at once.
     */
    public static function findByPublicId(string|int $publicId, array $with = []): ?self
    {
        $query = static::query();
        if ($with !== []) {
            $query->with($with);
        }

        $value = (string) $publicId;

        if (Str::isUuid($value)) {
            return $query->where('uuid', $value)->first();
        }

        if (ctype_digit($value)) {
            return $query->where('id', (int) $value)->first();
        }

        return null;
    }

    /**
     * Accept UUID (preferred) or legacy numeric id in route parameters.
     */
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if ($field !== null) {
            return parent::resolveRouteBinding($value, $field);
        }

        return static::findByPublicId($value);
    }

    public static function resolveWithDepartmentByPublicId(string|int|null $publicId): ?self
    {
        if ($publicId === null || $publicId === '') {
            return null;
        }

        return static::findByPublicId($publicId, ['department'])
            ?? static::query()->with('department')->where('user_id', (string) $publicId)->first();
    }

    public function departmentDisplayLabel(): string
    {
        $departmentName = trim((string) ($this->department?->name ?? ''));

        return $departmentName !== ''
            ? "{$departmentName} — ENCG Fès"
            : 'Corps Professoral — ENCG Fès';
    }
}
