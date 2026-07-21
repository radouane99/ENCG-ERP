<?php

namespace App\Traits;

use App\Models\ValidationAudit;
use App\Enums\ValidationStatus;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

trait HasValidationWorkflow
{
    public function validationAudits(): MorphMany
    {
        return $this->morphMany(ValidationAudit::class, 'validatable');
    }

    public function transitionTo(ValidationStatus $newStatus, ?string $comment = null): void
    {
        $oldStatus = $this->status ?? null;
        
        if ($oldStatus === $newStatus->value) {
            return;
        }

        $this->status = $newStatus->value;
        $this->save();

        $this->validationAudits()->create([
            'user_id' => Auth::id(),
            'old_status' => $oldStatus,
            'new_status' => $newStatus->value,
            'comment' => $comment,
        ]);

        $this->notifyUserOfStatusChange($newStatus);
    }

    protected function notifyUserOfStatusChange(ValidationStatus $newStatus): void
    {
        $user = null;

        if (method_exists($this, 'student') && $this->student) {
            // Retrieve User object from Student relation
            $user = $this->student->user ?? $this->student->getUserAttributeSafely('id') ? \App\Models\User::find($this->student->getUserAttributeSafely('id')) : null;
            // Since Student might delegate user properties, let's just use student->user relation or fallback.
            // Assuming student->user is a valid relation based on typical Eloquent models.
            if (!$user && method_exists($this->student, 'user')) {
                $user = $this->student->user;
            }
        } elseif (method_exists($this, 'user') && $this->user) {
            $user = $this->user;
        }

        if ($user) {
            $user->notify(new \App\Notifications\ValidationStatusUpdated($this, $newStatus->value));
        }
    }

    public function markAsReviewed(?string $comment = null): void
    {
        $this->transitionTo(ValidationStatus::REVIEWED, $comment);
    }

    public function approve(?string $comment = null): void
    {
        $this->transitionTo(ValidationStatus::APPROVED, $comment);
    }

    public function reject(?string $comment = null): void
    {
        $this->transitionTo(ValidationStatus::REJECTED, $comment);
    }

    public function archive(?string $comment = null): void
    {
        $this->transitionTo(ValidationStatus::ARCHIVED, $comment);
    }
}
