<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfessorDocumentRequest extends Model
{
    use HasFactory;

    protected $table = 'professor_document_requests';

    protected $fillable = [
        'user_id',
        'professor_id',
        'department_id',
        'document_type',
        'tracking_code',
        'purpose',
        'destination',
        'start_date',
        'end_date',
        'transport_mode',
        'vehicle_registration',
        'expense_coverage',
        'mission_category',
        'status',
        'department_visa',
        'department_visa_by',
        'department_visa_at',
        'department_notes',
        'direction_decision',
        'direction_signed_by',
        'direction_signed_at',
        'direction_notes',
        'admin_notes',
        'signed_by',
        'signed_at',
        'file_path',
        'qr_token',
        'digital_seal',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'signed_at' => 'datetime',
        'department_visa_at' => 'datetime',
        'direction_signed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function professor(): BelongsTo
    {
        return $this->belongsTo(Professor::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function departmentVisaUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'department_visa_by');
    }

    public function scopePendingDeptVisa(Builder $query): Builder
    {
        return $query->where('department_visa', 'pending')
            ->where('status', 'pending');
    }

    public function scopePendingDirection(Builder $query): Builder
    {
        return $query->where('department_visa', 'favorable')
            ->where('direction_decision', 'pending')
            ->where('status', 'pending');
    }

    public function scopeReady(Builder $query): Builder
    {
        return $query->whereIn('status', ['ready', 'approved']);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('status', 'rejected')
                ->orWhere('department_visa', 'unfavorable')
                ->orWhere('direction_decision', 'rejected');
        });
    }
}
