<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'admission_campaign_id' => $this->admission_campaign_id,
            'reference_number' => $this->reference_number,
            'personal_info' => [
                'first_name' => $this->first_name,
                'last_name' => $this->last_name,
                'email' => $this->email,
                'phone' => $this->phone,
                'cin' => $this->cin,
                'cne' => $this->cne,
                'birth_date' => $this->birth_date ? $this->birth_date->format('Y-m-d') : null,
            ],
            'academic_info' => [
                'bac_mention' => $this->bac_mention,
                'bac_average' => $this->bac_average,
                'bac_year' => $this->bac_year,
                'bac_series' => $this->bac_series,
            ],
            'evaluation' => [
                'status' => $this->status,
                'ranking' => $this->ranking,
                'entrance_exam_score' => $this->entrance_exam_score,
                'selection_score' => $this->selection_score,
                'rejection_reason' => $this->rejection_reason,
            ],
            'meta' => [
                'reviewed_at' => $this->reviewed_at,
                'created_at' => $this->created_at,
                'updated_at' => $this->updated_at,
            ]
        ];
    }
}
