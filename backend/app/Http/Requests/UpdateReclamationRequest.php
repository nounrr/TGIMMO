<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reclamations.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'reclamation_type_id' => ['sometimes','exists:reclamation_types,id'],
            'description' => ['sometimes','string'],
            'source' => ['sometimes','nullable','string','max:100'],
            'status' => ['sometimes','in:ouvert,en_cours,resolu,ferme'],
        ];
    }
}
