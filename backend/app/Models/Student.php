<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\StudentPathway;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

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
        'scholarship_type',
        'has_disability',
        'disability_details',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'has_disability' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pathways(): HasMany
    {
        return $this->hasMany(StudentPathway::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(StudentRegistration::class);
    }
}
