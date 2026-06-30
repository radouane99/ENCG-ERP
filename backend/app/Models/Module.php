<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Module extends Model
{
    use HasFactory;

    protected $fillable = [
        'institution_id',
        'filiere_id',
        'speciality_id',
        'name',
        'name_ar',
        'code',
        'semester_number',
        'coefficient',
        'credit_hours',
        'hours_cm',
        'hours_td',
        'hours_tp',
        'is_elective',
        'is_active',
    ];

    protected $casts = [
        'coefficient' => 'float',
        'credit_hours' => 'float',
        'is_elective' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function speciality(): BelongsTo
    {
        return $this->belongsTo(Speciality::class);
    }

    public function prerequisites(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'module_prerequisites', 'module_id', 'prerequisite_module_id');
    }
}
