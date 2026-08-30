<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, HasUuids, InteractsWithMedia, LogsActivity, Notifiable, SoftDeletes;

    protected $guard_name = 'sanctum';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty();
    }

    protected $guarded = [
        'id',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'is_active',
        'must_change_password',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'last_login_ip',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'two_factor_enabled' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function studentCard(): HasOne
    {
        return $this->hasOne(StudentCard::class, 'student_id');
    }

    public function professor(): HasOne
    {
        return $this->hasOne(Professor::class);
    }

    // ✅ AJOUTÉ : Relation pour les disponibilités des professeurs
    public function professorAvailabilities(): HasMany
    {
        return $this->hasMany(ProfessorAvailability::class, 'professor_id');
    }

    /**
     * Create a user while allowing guarded account flags (activation, password rotation).
     */
    public static function provision(array $attributes): static
    {
        [$safe, $guarded] = static::extractGuardedAccountAttributes($attributes);
        /** @var static $user */
        $user = static::query()->create($safe);
        if ($guarded !== []) {
            $user->forceFill($guarded)->save();
        }

        return $user;
    }

    public static function firstOrProvision(array $attributes, array $values = []): static
    {
        $existing = static::query()->where($attributes)->first();
        if ($existing) {
            return $existing;
        }

        return static::provision(array_merge($attributes, $values));
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}
     */
    public static function extractGuardedAccountAttributes(array $attributes): array
    {
        $guarded = [];
        foreach (['is_active', 'must_change_password'] as $key) {
            if (array_key_exists($key, $attributes)) {
                $guarded[$key] = $attributes[$key];
                unset($attributes[$key]);
            }
        }

        return [$attributes, $guarded];
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
