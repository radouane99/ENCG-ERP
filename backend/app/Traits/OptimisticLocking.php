<?php

namespace App\Traits;

use App\Exceptions\OptimisticLockException;
use Illuminate\Database\Eloquent\Builder;

trait OptimisticLocking
{
    public function initializeOptimisticLocking(): void
    {
        $this->attributes[$this->getVersionColumn()] ??= 1;
    }

    /** Compare and write atomically, even when save() has no version payload. */
    protected function performUpdate(Builder $query)
    {
        if ($this->fireModelEvent('updating') === false) {
            return false;
        }
        if ($this->usesTimestamps()) {
            $this->updateTimestamps();
        }
        $column = $this->getVersionColumn();
        $expected = (int) $this->getRawOriginal($column);
        $this->setAttribute($column, $expected + 1);
        $dirty = $this->getDirtyForUpdate();
        $affected = $this->setKeysForSaveQuery($query)->where($column, $expected)->update($dirty);
        if ($affected !== 1) {
            $this->setAttribute($column, $expected);
            throw new OptimisticLockException;
        }
        $this->syncChanges();
        $this->fireModelEvent('updated', false);

        return true;
    }

    public function getVersionColumn(): string
    {
        return defined('static::VERSION') ? static::VERSION : 'version';
    }
}
