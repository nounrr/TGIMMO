<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReclamationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reclamations.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'unite_id' => ['required','exists:unites,id'],
            'reclamation_type_id' => ['required','exists:reclamation_types,id'],
            'description' => ['required','string'],
            'source' => ['nullable','string','max:100'],
            'status' => ['nullable','in:ouvert,en_cours,resolu,ferme'],
            'files' => ['nullable','array'],
            'files.*' => ['file','max:5120'], // 5MB each
        ];
    }
}
