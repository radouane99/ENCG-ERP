<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * [Phase 8] AttendanceSessionResource
 *
 * Standardizes the AttendanceSession API response.
 * Mirrors the frontend AttendanceSession interface in src/types/models.ts.
 */
class AttendanceSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'professor_id' => $this->professor_id,
            'module_name'  => $this->module_name,
            'group_name'   => $this->group_name,
            'room_name'    => $this->room_name,
            'status'       => $this->status,
            'session_type' => $this->session_type,
            'started_at'   => $this->started_at?->toDateTimeString(),
            'qr_token'     => $this->qr_token,
            'qr_expires_at'=> $this->qr_expires_at?->toDateTimeString(),
            'created_at'   => $this->created_at?->format('Y-m-d H:i'),

            // Aggregates
            'records_count' => $this->records_count ?? $this->whenCounted('attendanceRecords', null, 0),

            // Compatibility properties for specific admin views
            'professor_name' => $this->professor && $this->professor->user 
                ? trim($this->professor->user->first_name . ' ' . $this->professor->user->last_name) 
                : '—',

            // Related professor (conditionally embedded)
            'professor' => $this->whenLoaded('professor', fn() => [
                'id'              => $this->professor->id,
                'employee_number' => $this->professor->employee_number,
                'first_name'      => $this->professor->first_name,
                'last_name'       => $this->professor->last_name,
            ]),

            'created_at' => $this->created_at->toDateTimeString(),
            'updated_at' => $this->updated_at->toDateTimeString(),
        ];
    }
}
