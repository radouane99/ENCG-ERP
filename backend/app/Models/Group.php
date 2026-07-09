<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Group extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    public function filiere(): BelongsTo
    {
        return $this->belongsTo(Filiere::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function speciality(): BelongsTo
    {
        return $this->belongsTo(Speciality::class);
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
