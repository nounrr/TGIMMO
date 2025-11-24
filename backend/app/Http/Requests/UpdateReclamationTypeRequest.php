<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReclamationTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reclamation-types.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes','string','max:150'],
            'description' => ['sometimes','nullable','string'],
            'active' => ['sometimes','boolean'],
        ];
    }
}
