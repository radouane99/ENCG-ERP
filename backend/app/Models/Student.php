<?php

namespace App\Models;

/**
 * @property string|null $cne
 * @property string|null $father_phone
 * @property string|null $parent_phone
 * @property string|null $exam_date
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string|null $name
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $cin
 */
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Student extends Model
{
    use HasFactory, HasUuids, LogsActivity, SoftDeletes;

    private array $pendingIdentity = [];

    public function save(array $options = [])
    {
        return DB::transaction(function () use ($options) {
            $identity = $this->pendingIdentity;
            if ($identity && $this->user_id) {
                $user = User::whereKey($this->user_id)->lockForUpdate()->firstOrFail();
                $user->fill($identity);
                $user->save();
                $this->setRelation('user', $user);
            }
            $saved = parent::save($options);
            if ($saved) {
                $this->pendingIdentity = [];
            }

            return $saved;
        });
    }

    protected function birthDate(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('birth_date', $this->pendingIdentity) ? $this->pendingIdentity['birth_date'] : $this->getUserAttributeSafely('birth_date'),
            set: function ($value) {
                $this->pendingIdentity['birth_date'] = $value;

                return [];
            });
    }

    protected function address(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('address', $this->pendingIdentity) ? $this->pendingIdentity['address'] : $this->getUserAttributeSafely('address'),
            set: function ($value) {
                $this->pendingIdentity['address'] = $value;

                return [];
            });
    }

    protected function city(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('city', $this->pendingIdentity) ? $this->pendingIdentity['city'] : $this->getUserAttributeSafely('city'),
            set: function ($value) {
                $this->pendingIdentity['city'] = $value;

                return [];
            });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty();
    }

    protected $guarded = ['id'];

    protected $fillable = [
        'institution_id',
        'user_id',
        'student_number',
        'cne',
        'cin',
        'massar_code',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'birth_date',
        'birth_city',
        'birth_country',
        'gender',
        'nationality',
        'photo_path',
        'email',
        'phone',
        'address',
        'city',
        'region',
        'postal_code',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'status',
        'inscription_status',
        'academic_year',
        'scholarship_type',
        'has_disability',
        'disability_details',
        'filiere_id',
        'group_id',
    ];

    protected function casts(): array
    {
        return [
            'has_disability' => 'boolean',
        ];
    }

    /**
     * Alias virtuel pour le Code Massar. Dans le système unifié marocain,
     * CNE et Code Massar désignent le même identifiant (ex: N132456789).
     * Le stockage physique réside exclusivement dans la colonne `cne` (zéro redondance BDD).
     */
    protected function massarCode(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->attributes['cne'] ?? null,
            set: fn ($val) => [
                'cne' => $val,
            ],
        );
    }

    public function getUserAttributeSafely(string $attribute)
    {
        $identityUser = $this->relationLoaded('user') ? $this->getRelation('user') : $this->user()->first();

        return $identityUser ? $identityUser->getAttribute($attribute) : ($this->attributes[$attribute] ?? null);
    }

    protected function firstName(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('first_name', $this->pendingIdentity) ? $this->pendingIdentity['first_name'] : $this->getUserAttributeSafely('first_name'),
            set: function ($value) {
                $this->pendingIdentity['first_name'] = $value;

                return [];
            });
    }

    protected function lastName(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('last_name', $this->pendingIdentity) ? $this->pendingIdentity['last_name'] : $this->getUserAttributeSafely('last_name'),
            set: function ($value) {
                $this->pendingIdentity['last_name'] = $value;

                return [];
            });
    }

    protected function email(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('email', $this->pendingIdentity) ? $this->pendingIdentity['email'] : $this->getUserAttributeSafely('email'),
            set: function ($value) {
                $this->pendingIdentity['email'] = $value;

                return [];
            });
    }

    protected function phone(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('phone', $this->pendingIdentity) ? $this->pendingIdentity['phone'] : $this->getUserAttributeSafely('phone'),
            set: function ($value) {
                $this->pendingIdentity['phone'] = $value;

                return [];
            });
    }

    protected function cin(): Attribute
    {
        return Attribute::make(get: fn () => array_key_exists('cin', $this->pendingIdentity) ? $this->pendingIdentity['cin'] : $this->getUserAttributeSafely('cin'),
            set: function ($value) {
                $this->pendingIdentity['cin'] = $value;

                return [];
            });
    }

    /**
     * CNIE/CIN is stored on users (identity SSOT). students.cin was dropped
     * by the identity-normalize migration and may be absent in production.
     */
    public function scopeWhereCin(Builder $query, ?string $cin): Builder
    {
        $cin = strtoupper(trim((string) $cin));
        if ($cin === '') {
            return $query->whereRaw('1 = 0');
        }

        return $query->whereHas('user', fn (Builder $u) => $u->where('cin', $cin));
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function internships(): HasMany
    {
        return $this->hasMany(Internship::class);
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }

    public function blockchainCertificates(): HasMany
    {
        return $this->hasMany(BlockchainCertificate::class);
    }

    public function pathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }

    public function latestPathway(): HasOne
    {
        return $this->hasOne(StudentPathway::class)->latestOfMany();
    }

    public function graduations(): HasMany
    {
        return $this->hasMany(StudentGraduation::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(StudentRegistration::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    // ✅ AJOUTÉ : Relation pour les pointages de présence
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function resitEligibilities(): HasMany
    {
        return $this->hasMany(ResitEligibility::class, 'student_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }

    public function documentRequests(): HasMany
    {
        return $this->hasMany(DocumentRequest::class, 'student_id');
    }

    public function studentDocuments(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    public static function generateStudentNumber(string $filiereCode, int $year): string
    {
        $prefix = 'ENCG-FES-'.$year.'-'.strtoupper($filiereCode);
        $lastStudent = self::where('student_number', 'like', $prefix.'-%')
            ->orderByDesc('student_number')
            ->first();

        $seq = 1;
        if ($lastStudent) {
            $parts = explode('-', (string) $lastStudent->student_number);
            $seq = ((int) end($parts)) + 1;
        }

        return $prefix.'-'.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if (is_numeric($value)) {
            $student = $this->where('id', (int) $value)->first();
            if ($student) {
                return $student;
            }

            // Fallback: If numeric value corresponds to an Application ID, resolve student via CNE
            $app = Application::find((int) $value);
            if ($app && ! empty($app->cne)) {
                $studentByCne = $this->where('cne', $app->cne)->first();
                if ($studentByCne) {
                    return $studentByCne;
                }
            }

            return null;
        }

        if (Str::isUuid($value)) {
            return $this->where('uuid', $value)->first();
        }

        return $this->where('student_number', $value)->orWhere('cne', $value)->first();
    }

    public function mobilityChoices(): HasMany
    {
        return $this->hasMany(StudentMobilityChoice::class);
    }
}
