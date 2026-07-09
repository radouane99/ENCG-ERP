<?php

namespace App\Traits;

use App\Exceptions\OptimisticLockException;
use Illuminate\Database\Eloquent\Model;

trait OptimisticLocking
{
    /**
     * Boot the optimistic locking trait for a model.
     *
     * @return void
     */
    public static function bootOptimisticLocking()
    {
        static::updating(function (Model $model) {
            $versionColumn = $model->getVersionColumn();

            // Only enforce if the version column exists and is dirty (provided in the update payload)
            // Or we can just always enforce it by requiring the original version.
            if ($model->isDirty($versionColumn)) {
                // If the version provided by the client doesn't match the one in the DB (original)
                // it means someone else updated the record in the meantime.
                // Wait, Laravel sets the original value when fetching the model. 
                // We just need to check if the database still has this original value.
                
                // Let's get the version from the DB directly to be absolutely sure
                $currentDbVersion = $model->newQuery()->where($model->getKeyName(), $model->getKey())->value($versionColumn);
                
                $originalVersion = $model->getOriginal($versionColumn);
                
                if ($currentDbVersion !== $originalVersion) {
                    throw new OptimisticLockException();
                }

                // Increment the version for the new save
                $model->{$versionColumn} = $currentDbVersion + 1;
            } else {
                 // Automatically increment on every update to maintain optimistic locking integrity
                 $model->{$versionColumn} = $model->{$versionColumn} + 1;
            }
        });
    }

    /**
     * Get the name of the "version" column.
     *
     * @return string
     */
    public function getVersionColumn()
    {
        return defined('static::VERSION') ? static::VERSION : 'version';
    }
}
