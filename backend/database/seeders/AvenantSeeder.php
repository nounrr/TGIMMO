<?php

namespace Database\Seeders;

use App\Models\AvenantMandat;
use App\Models\MandatGestion;
use App\Models\Proprietaire;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AvenantSeeder extends Seeder
{
    public function run(): void
    {
        $owner = Proprietaire::first();
        $user = User::first();

        if (!$owner || !$user) {
            $this->command->warn('Aucun proprietaire ou utilisateur trouvE - impossible de creer des avenants.');
            return;
        }

        // Creer quelques mandats pour supporter les avenants
        $mandats = collect();
        for ($i = 1; $i <= 3; $i++) {
            $dateDebut = Carbon::now()->subMonths(6 * $i);
            $mandats->push(MandatGestion::create([
                'proprietaire_id' => $owner->id,
                'reference' => 'MDT-' . date('Y') . '-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'date_debut' => $dateDebut,
                'date_fin' => $dateDebut->copy()->addMonths(24),
                'taux_gestion_pct' => 10,
                'assiette_honoraires' => 'loyers_encaisse',
                'tva_applicable' => false,
                'periodicite_releve' => 'trimestriel',
                'charge_maintenance' => 'proprietaire',
                'mode_versement' => 'virement',
                'description_bien' => 'Mandat de gestion test #' . $i,
                'usage_bien' => 'habitation',
                'pouvoirs_accordes' => 'Pouvoirs standards de gestion locative.',
                'lieu_signature' => 'Casablanca',
                'date_signature' => $dateDebut,
                'langue' => 'fr',
                'notes_clauses' => 'Conditions particuliA"res de test.',
                'statut' => 'actif',
                'created_by' => $user->id,
            ]));
        }

        $this->command->info('Creation de 3 mandats et avenants de test...');

        foreach ($mandats as $index => $mandat) {
            AvenantMandat::create([
                'mandat_id' => $mandat->id,
                'reference' => 'AV-' . date('Y') . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'date_pouvoir_initial' => $mandat->date_signature,
                'objet_resume' => 'Avenant de test #' . ($index + 1),
                'modifs_text' => 'Ajustement de clause pour test.',
                'date_effet' => Carbon::now()->subMonths($index + 1),
                'lieu_signature' => 'Casablanca',
                'date_signature' => Carbon::now()->subMonths($index + 1),
                'rep_b_user_id' => $user->id,
                'statut' => 'actif',
                'fichier_url' => null,
                'created_by' => $user->id,
            ]);
        }

        $this->command->info('Avenants de test crAces avec succes.');
    }
}
