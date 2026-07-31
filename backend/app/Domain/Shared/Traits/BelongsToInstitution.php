<?php

namespace App\Domain\Shared\Traits;

use App\Models\Institution;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToInstitution
{
    /**
     * Get the institution that the model belongs to.
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class, 'institution_id');
    }
}
