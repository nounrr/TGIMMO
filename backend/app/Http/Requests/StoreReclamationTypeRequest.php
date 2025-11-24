<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReclamationTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reclamation-types.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:150'],
            'description' => ['nullable','string'],
            'active' => ['boolean'],
        ];
    }
}
