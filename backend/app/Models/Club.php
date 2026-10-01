<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Club extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $guarded = ['id'];

    protected $appends = ['encrypted_verify_token', 'verification_url'];

    public function getEncryptedVerifyTokenAttribute(): string
    {
        $agrementRef = 'AGR-ENCG-' . date('Y') . '-' . str_pad($this->id, 4, '0', STR_PAD_LEFT);
        $payload = "club_agrement:{$this->id}:{$agrementRef}:" . date('Ymd');
        $raw = \Illuminate\Support\Facades\Crypt::encryptString($payload);
        return 'ENC-' . rtrim(strtr($raw, '+/', '-_'), '=');
    }

    public function getVerificationUrlAttribute(): string
    {
        $baseUrl = config('app.frontend_url') ?: (config('app.url') ?: 'https://encg-fes.ac.ma');
        return rtrim($baseUrl, '/') . '/verify-document/' . $this->getEncryptedVerifyTokenAttribute();
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClubMember::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ClubEvent::class);
    }
}
