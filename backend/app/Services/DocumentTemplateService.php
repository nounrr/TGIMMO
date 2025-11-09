<?php

namespace App\Services;

use App\Models\Proprietaire;
use App\Models\Unite;

class DocumentTemplateService
{
    /**
     * Build a short human-readable description of a unit.
     */
    public function buildUniteDescription(Unite $unite): string
    {
        $parts = [];
        if ($unite->numero_unite) $parts[] = "Unité {$unite->numero_unite}";
        if ($unite->immeuble) $parts[] = "Immeuble {$unite->immeuble}";
        if ($unite->bloc) $parts[] = "Bloc {$unite->bloc}";
        if ($unite->etage) $parts[] = "Étage {$unite->etage}";
        if ($unite->superficie_m2) $parts[] = number_format((float)$unite->superficie_m2, 2, '.', ' ') . ' m²';
        $address = trim((string)$unite->adresse_complete);
        $desc = implode(' - ', $parts);
        return trim($desc . ($address ? " | {$address}" : ''));
    }

    /**
     * Choose the Arabic mandate template based on owner type and return its raw text.
     */
    public function getMandatTemplateFor(Proprietaire $p): string
    {
        // Heuristic: if company identifiers exist (RC/ICE/IF), use société template, else personne
        $isSociete = !empty($p->rc) || !empty($p->ice) || !empty($p->ifiscale) || $p->type_proprietaire === 'societe' || $p->type_proprietaire === 'personne_morale';
        // In Laravel, base_path() points to the backend/ root. Templates are currently stored under app/Models.
        $file = $isSociete ? base_path('app/Models/amlak societe.txt') : base_path('app/Models/amlak persone.txt');
        return @file_get_contents($file) ?: '';
    }

    /**
     * Explicit template selection: 'personne' or 'societe'. Any other value falls back to heuristic.
     */
    public function getMandatTemplateByType(?string $type, Proprietaire $p): string
    {
        $type = $type ? strtolower(trim($type)) : null;
        if ($type === 'personne') {
            return @file_get_contents(base_path('app/Models/amlak persone.txt')) ?: '';
        }
        if ($type === 'societe') {
            return @file_get_contents(base_path('app/Models/amlak societe.txt')) ?: '';
        }
        return $this->getMandatTemplateFor($p);
    }

    /**
     * Return the French Avenant template raw text.
     */
    public function getAvenantTemplate(): string
    {
        $file = base_path('app/Models/avenat au pouvoir.txt');
        return @file_get_contents($file) ?: '';
    }
}
