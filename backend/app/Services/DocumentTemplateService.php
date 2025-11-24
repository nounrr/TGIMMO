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

    /**
     * Generate DOCX for Reclamation
     */
    public function generateReclamationDocx($reclamation): string
    {
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $section = $phpWord->addSection();
        
        // Title
        $section->addText('RÉCLAMATION', ['bold' => true, 'size' => 16], ['alignment' => 'center']);
        $section->addTextBreak(1);
        
        // Details
        $section->addText("N° de réclamation: {$reclamation->id}", ['bold' => true]);
        $section->addText("Date: " . ($reclamation->created_at ? $reclamation->created_at->format('d/m/Y H:i') : '—'));
        $section->addText("Bail: " . ($reclamation->bail->numero_bail ?? "#{$reclamation->bail_id}"));
        $section->addText("Type: " . ($reclamation->type->name ?? 'Non spécifié'));
        $section->addText("Statut: " . strtoupper($reclamation->status));
        $section->addText("Source: " . ($reclamation->source ?? 'Non spécifié'));
        $section->addTextBreak(1);
        
        $section->addText('Description:', ['bold' => true]);
        $section->addText($reclamation->description ?? '');
        $section->addTextBreak(1);
        
        if ($reclamation->justifications && count($reclamation->justifications) > 0) {
            $section->addText("Nombre de justificatifs: " . count($reclamation->justifications));
        }
        
        $tmpFile = tempnam(sys_get_temp_dir(), 'reclamation_') . '.docx';
        $phpWord->save($tmpFile, 'Word2007');
        return $tmpFile;
    }

    /**
     * Generate DOCX for Intervention
     */
    public function generateInterventionDocx($intervention): string
    {
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $section = $phpWord->addSection();
        
        $section->addText('DEMANDE D\'INTERVENTION', ['bold' => true, 'size' => 16], ['alignment' => 'center']);
        $section->addTextBreak(1);
        
        $section->addText("N° d'intervention: {$intervention->id}", ['bold' => true]);
        $section->addText("Date de demande: " . ($intervention->date_demande ? date('d/m/Y', strtotime($intervention->date_demande)) : '—'));
        $section->addText("Urgence: " . strtoupper($intervention->urgence));
        $section->addText("Statut: " . strtoupper($intervention->status));
        
        if ($intervention->bail) {
            $section->addText("Bail: " . ($intervention->bail->numero_bail ?? "#{$intervention->bail_id}"));
        }
        $section->addTextBreak(1);
        
        $section->addText('Demandeur:', ['bold' => true]);
        $section->addText("Nom/Société: " . ($intervention->demandeur_nom_societe ?? '—'));
        $section->addText("Service: " . ($intervention->demandeur_service ?? '—'));
        $section->addText("Téléphone: " . ($intervention->demandeur_telephone ?? '—'));
        $section->addText("Email: " . ($intervention->demandeur_email ?? '—'));
        $section->addTextBreak(1);
        
        $section->addText('Détails de l\'intervention:', ['bold' => true]);
        $section->addText("Nature: " . ($intervention->nature_probleme ?? '—'));
        $section->addText("Localisation: " . ($intervention->localisation ?? '—'));
        $section->addTextBreak(1);
        
        if ($intervention->symptomes) {
            $section->addText('Symptômes:', ['bold' => true]);
            $section->addText($intervention->symptomes);
            $section->addTextBreak(1);
        }
        
        if ($intervention->prestataire) {
            $section->addText("Prestataire: " . $intervention->prestataire->nom);
        }
        
        if ($intervention->date_planifiee) {
            $section->addText("Date planifiée: " . date('d/m/Y', strtotime($intervention->date_planifiee)));
        }
        
        $tmpFile = tempnam(sys_get_temp_dir(), 'intervention_') . '.docx';
        $phpWord->save($tmpFile, 'Word2007');
        return $tmpFile;
    }

    /**
     * Generate DOCX for Devis
     */
    public function generateDevisDocx($devis): string
    {
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $section = $phpWord->addSection();
        
        $section->addText('DEVIS', ['bold' => true, 'size' => 18], ['alignment' => 'center']);
        $section->addTextBreak(1);
        
        $section->addText("N° de devis: " . ($devis->numero ?? "DEV-{$devis->id}"), ['bold' => true, 'size' => 12]);
        $section->addText("Date de proposition: " . ($devis->date_proposition ? $devis->date_proposition->format('d/m/Y') : '—'));
        
        if ($devis->valid_until) {
            $section->addText("Valable jusqu'au: " . $devis->valid_until->format('d/m/Y'));
        }
        $section->addTextBreak(1);
        
        if ($devis->prestataire) {
            $section->addText('Prestataire:', ['bold' => true]);
            $section->addText($devis->prestataire->nom);
            if ($devis->prestataire->telephone) $section->addText("Tél: " . $devis->prestataire->telephone);
            if ($devis->prestataire->email) $section->addText("Email: " . $devis->prestataire->email);
            $section->addTextBreak(1);
        }
        
        if ($devis->intervention) {
            $section->addText("Intervention N°: {$devis->intervention_id}");
            $section->addTextBreak(1);
        }
        
        $section->addText('Montants:', ['bold' => true]);
        $section->addText("Montant HT: " . number_format($devis->montant_ht, 2, ',', ' ') . " MAD");
        $section->addText("TVA: {$devis->tva}%");
        $section->addText("Total TTC: " . number_format($devis->total_ttc, 2, ',', ' ') . " MAD", ['bold' => true]);
        $section->addTextBreak(1);
        
        $section->addText("Statut: " . strtoupper($devis->status), ['bold' => true]);
        
        $tmpFile = tempnam(sys_get_temp_dir(), 'devis_') . '.docx';
        $phpWord->save($tmpFile, 'Word2007');
        return $tmpFile;
    }

    /**
     * Generate DOCX for Facture
     */
    public function generateFactureDocx($facture): string
    {
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $section = $phpWord->addSection();
        
        $section->addText('FACTURE', ['bold' => true, 'size' => 18], ['alignment' => 'center']);
        $section->addTextBreak(1);
        
        $section->addText("N° de facture: " . ($facture->numero ?? "FACT-{$facture->id}"), ['bold' => true, 'size' => 12]);
        $section->addText("Date d'émission: " . ($facture->date ? $facture->date->format('d/m/Y') : '—'));
        
        if ($facture->due_date) {
            $section->addText("Date d'échéance: " . $facture->due_date->format('d/m/Y'));
        }
        $section->addTextBreak(1);
        
        if ($facture->prestataire) {
            $section->addText('Prestataire:', ['bold' => true]);
            $section->addText($facture->prestataire->nom);
            if ($facture->prestataire->adresse) $section->addText($facture->prestataire->adresse);
            if ($facture->prestataire->telephone) $section->addText("Tél: " . $facture->prestataire->telephone);
            $section->addTextBreak(1);
        }
        
        if ($facture->intervention) {
            $section->addText("Intervention N°: {$facture->intervention_id}");
            $section->addTextBreak(1);
        }
        
        $section->addText('Montants:', ['bold' => true]);
        $section->addText("Montant HT: " . number_format($facture->montant_ht, 2, ',', ' ') . " MAD");
        $section->addText("TVA: {$facture->tva}%");
        $section->addText("Total TTC: " . number_format($facture->total_ttc, 2, ',', ' ') . " MAD", ['bold' => true, 'size' => 12]);
        $section->addTextBreak(1);
        
        $section->addText("Statut: " . strtoupper($facture->status), ['bold' => true]);
        
        if ($facture->paid_at) {
            $section->addText("Payée le: " . $facture->paid_at->format('d/m/Y'), ['color' => '008000']);
        }
        
        $tmpFile = tempnam(sys_get_temp_dir(), 'facture_') . '.docx';
        $phpWord->save($tmpFile, 'Word2007');
        return $tmpFile;
    }
}
