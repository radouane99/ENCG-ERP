<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function (Model $model) {
            static::auditModelEvent('created', $model, null, $model->getAuditableAttributes());
        });

        static::updated(function (Model $model) {
            $dirty = $model->getDirty();
            // Filter out internal non-business attributes if only updated_at changed
            if (count($dirty) === 1 && isset($dirty['updated_at'])) {
                return;
            }

            $oldValues = array_intersect_key($model->getOriginal(), $dirty);
            $newValues = $dirty;

            // Remove sensitive fields
            $oldValues = static::cleanSensitiveAuditFields($oldValues);
            $newValues = static::cleanSensitiveAuditFields($newValues);

            if (! empty($oldValues) || ! empty($newValues)) {
                static::auditModelEvent('updated', $model, $oldValues, $newValues);
            }
        });

        static::deleted(function (Model $model) {
            static::auditModelEvent('deleted', $model, static::cleanSensitiveAuditFields($model->getOriginal()), null);
        });
    }

    protected static function auditModelEvent(string $event, Model $model, ?array $oldValues, ?array $newValues): void
    {
        try {
            $user = Auth::user();
            $className = class_basename($model);
            $primaryKey = $model->getKey();

            $actionType = static::resolveAuditActionType($className, $event);
            $severity = static::resolveAuditSeverity($className, $event, $oldValues, $newValues);
            $description = static::buildAuditDescription($className, $primaryKey, $event, $oldValues, $newValues);

            AuditLog::record([
                'user_id' => $user?->id,
                'user_name' => $user ? ($user->name ?? trim(($user->first_name ?? '').' '.($user->last_name ?? ''))) : 'Système Automatique',
                'user_email' => $user?->email,
                'user_role' => $user?->role ?? ($user?->roles?->first()?->name ?? 'System'),
                'auditable_type' => get_class($model),
                'auditable_id' => $primaryKey,
                'event' => $event,
                'action' => "{$className} : {$event}",
                'action_type' => $actionType,
                'description' => $description,
                'method' => Request::method() ?: 'CLI',
                'url' => Request::fullUrl() ?: 'System Task',
                'ip_address' => Request::ip() ?: '127.0.0.1',
                'user_agent' => Request::userAgent() ?: 'Internal Eloquent Hook',
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'severity' => $severity,
            ]);
        } catch (\Throwable $e) {
            // Fail silently to never interrupt critical business transactions
            Log::warning("Auditable Trait Warning on {$className}: ".$e->getMessage());
        }
    }

    protected function getAuditableAttributes(): array
    {
        return static::cleanSensitiveAuditFields($this->getAttributes());
    }

    protected static function cleanSensitiveAuditFields(array $attributes): array
    {
        $hidden = [
            'password',
            'remember_token',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'two_factor_confirmed_at',
            'api_token',
            'secret',
        ];

        return array_diff_key($attributes, array_flip($hidden));
    }

    protected static function resolveAuditActionType(string $className, string $event): string
    {
        return match ($className) {
            'Grade', 'GradeComponent' => 'GRADE_MUTATION',
            'Deliberation', 'DeliberationDecision', 'ModuleValidation' => 'APOGEE_OVERRIDE',
            'StudentRegistration', 'Student' => 'STUDENT_DOSSIER',
            'ProfessorDocumentRequest' => 'PARAPHEUR_VISA',
            'Schedule', 'RoomBooking' => 'TIMETABLE_CHANGE',
            'VacationContract', 'VacationPayment' => 'FINANCE_TRANSACTION',
            'DisciplinaryCase', 'ExamIncident' => 'DISCIPLINARY_ACTION',
            'User', 'Role', 'Permission' => 'SECURITY_AUDIT',
            default => 'DATA_MUTATION',
        };
    }

    protected static function resolveAuditSeverity(string $className, string $event, ?array $old, ?array $new): string
    {
        if ($event === 'deleted') {
            return 'danger';
        }

        if (in_array($className, ['Grade', 'DeliberationDecision', 'User', 'Role'])) {
            return 'warning';
        }

        return 'info';
    }

    protected static function buildAuditDescription(string $className, mixed $id, string $event, ?array $old, ?array $new): string
    {
        if ($event === 'created') {
            return "Création de l'enregistrement {$className} #{$id}";
        }

        if ($event === 'deleted') {
            return "Suppression définitive de {$className} #{$id}";
        }

        $changes = [];
        if ($old && $new) {
            foreach ($new as $key => $newVal) {
                $oldVal = $old[$key] ?? 'null';
                $oldStr = is_scalar($oldVal) ? (string) $oldVal : json_encode($oldVal);
                $newStr = is_scalar($newVal) ? (string) $newVal : json_encode($newVal);
                $changes[] = "{$key} ({$oldStr} ➔ {$newStr})";
            }
        }

        $diffSummary = ! empty($changes) ? implode(', ', array_slice($changes, 0, 4)) : 'Mise à jour des attributs';

        return "Modification de {$className} #{$id} : {$diffSummary}";
    }
}
