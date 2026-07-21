<?php

namespace App\Observers;

use App\Models\Grade;
use App\Models\GradeAudit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class GradeObserver
{
    /**
     * Handle the Grade "updated" event.
     */
    public function updated(Grade $grade): void
    {
        if ($grade->isDirty('value')) {
            GradeAudit::create([
                'grade_id' => $grade->id,
                'user_id' => Auth::id(),
                'old_value' => $grade->getOriginal('value'),
                'new_value' => $grade->value,
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
                'reason' => 'Modification de la note',
            ]);
        }
    }
}
