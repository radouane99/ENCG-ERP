<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Speciality extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }
}
