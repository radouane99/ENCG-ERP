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
            if (! auth()->check()) {
                return;
            }

            if ($model->hasAuditColumn('created_by') && empty($model->created_by)) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (! auth()->check()) {
                return;
            }

            if ($model->hasAuditColumn('updated_by')) {
                $model->updated_by = auth()->id();
            }
        });
    }

    /**
     * Eloquent attributes are not class properties; inspect the table schema.
     */
    protected function hasAuditColumn(string $column): bool
    {
        static $columns = [];

        $key = $this->getConnectionName().'.'.$this->getTable().'.'.$column;

        if (! array_key_exists($key, $columns)) {
            $columns[$key] = $this->getConnection()
                ->getSchemaBuilder()
                ->hasColumn($this->getTable(), $column);
        }

        return $columns[$key];
    }
}
