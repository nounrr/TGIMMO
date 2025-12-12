<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreUniteOwnershipsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route is behind auth middleware; add policy later if needed
        return true;
    }

    public function rules(): array
    {
        return [
            'unite_id' => ['required', 'integer', 'exists:unites,id'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'owners' => ['required', 'array', 'min:1'],
            'owners.*.proprietaire_id' => ['required', 'integer', 'distinct', 'exists:proprietaires,id'],
            'owners.*.part_numerateur' => ['required', 'integer', 'min:1'],
            'owners.*.part_denominateur' => ['required', 'integer', 'min:1'],
            // Optional: trigger auto document generation (mandat & avenant)
            'generate_documents' => ['sometimes', 'boolean'],
            // Options for generated documents
            'mandat_template_type' => ['sometimes', 'in:auto,personne,societe'],
            'mandat_langue' => ['sometimes', 'in:ar,fr,ar_fr'],
            'create_avenant' => ['sometimes', 'boolean'],
            'include_all_owner_names' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator)
    {
        $validator->after(function (Validator $validator) {
            $owners = $this->input('owners', []);
            if (!is_array($owners) || empty($owners)) {
                return;
            }

            // Validate per-owner denominator >= numerator
            foreach ($owners as $idx => $o) {
                $num = (int)($o['part_numerateur'] ?? 0);
                $den = (int)($o['part_denominateur'] ?? 0);
                if ($den < $num) {
                    $validator->errors()->add("owners.$idx.part_denominateur", 'Le dénominateur doit être supérieur ou égal au numérateur.');
                }
            }

            // Validate total equals 1
            $total = 0.0;
            foreach ($owners as $o) {
                $num = (int)($o['part_numerateur'] ?? 0);
                $den = (int)($o['part_denominateur'] ?? 1);
                if ($den <= 0) continue;
                $total += $num / $den;
            }
            if (abs($total - 1.0) > 0.0001) {
                $validator->errors()->add('owners', 'Le total des parts doit être égal à 1 (100%). Total actuel: ' . round($total * 100, 4) . '%.');
            }
        });
    }
}
