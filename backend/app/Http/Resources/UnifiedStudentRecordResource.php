<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnifiedStudentRecordResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        // Fallback for role check, assuming Spatie or standard attribute
        $isAdmin = $user && ((method_exists($user, 'hasRole') && $user->hasRole('admin')) || $user->role === 'admin');

        // Include the base student profile data
        $data = (new StudentResource($this))->toArray($request);

        // Include conditionally loaded relationships
        $data['academic_records'] = $this->whenLoaded('grades', function () {
            return $this->grades->map(function ($grade) {
                return [
                    'id' => $grade->id,
                    'module' => $grade->assessment?->module?->name,
                    'assessment_type' => $grade->assessment?->type,
                    'value' => $grade->value,
                    'absent' => $grade->absent,
                    'status' => $grade->status, // Based on the validation workflow
                ];
            });
        });

        $data['absences'] = $this->whenLoaded('attendances', function () {
            return $this->attendances->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'session_date' => $attendance->attendanceSession?->session_date,
                    'module' => $attendance->attendanceSession?->module?->name,
                    'status' => $attendance->status,
                    'justified' => (bool) $attendance->absenceJustification,
                ];
            });
        });

        $data['documents'] = $this->whenLoaded('documentRequests', function () use ($isAdmin) {
            return $this->documentRequests->map(function ($doc) use ($isAdmin) {
                $docData = [
                    'id' => $doc->id,
                    'type' => $doc->documentType?->name,
                    'status' => $doc->status,
                    'requested_at' => $doc->requested_at?->toIso8601String(),
                    'processed_at' => $doc->processed_at?->toIso8601String(),
                ];
                
                // Expose admin_notes only for admins
                if ($isAdmin) {
                    $docData['admin_notes'] = $doc->admin_notes;
                }
                
                return $docData;
            });
        });

        $data['internships'] = $this->whenLoaded('internships', function () {
            return $this->internships->map(function ($internship) {
                return [
                    'id' => $internship->id,
                    'type' => $internship->type,
                    'company' => $internship->company_name,
                    'start_date' => $internship->start_date?->format('Y-m-d'),
                    'end_date' => $internship->end_date?->format('Y-m-d'),
                    'status' => $internship->status,
                ];
            });
        });

        return $data;
    }
}
