<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGeneratedContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'ai_conversation_id',
        'prompt',
        'response',
        'content_type',
        'tokens_used',
        'driver_used',
    ];

    protected $casts = [
        'tokens_used' => 'integer',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'ai_conversation_id');
    }
}
