<?php

namespace App\Domain\Shared\Traits;

trait Auditable
{
    /**
     * Boot the auditable trait for the model.
     */
    public static function bootAuditable(): void
    {
        static::creating(function ($model) {
            if (auth()->check() && property_exists($model, 'created_by') && empty($model->created_by)) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check() && property_exists($model, 'updated_by')) {
                $model->updated_by = auth()->id();
            }
        });
    }
}
