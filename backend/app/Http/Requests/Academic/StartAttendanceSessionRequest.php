<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class StartAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('attendance.manage') || $this->user()->hasRole('professor');
    }

    public function rules(): array
    {
        return [
            'module_id' => 'required|exists:modules,id',
            'group_id' => 'required|exists:groups,id',
            'room_name' => 'required|string|max:100',
        ];
    }
}
