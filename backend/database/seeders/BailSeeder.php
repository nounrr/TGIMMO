<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Bail;
use App\Models\Locataire;
use App\Models\Unite;
use Carbon\Carbon;

class BailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Récupérer quelques locataires et unités disponibles
        $locataires = Locataire::limit(5)->get();
        $unites = Unite::where('statut', 'vacant')->limit(5)->get();

        if ($locataires->isEmpty()) {
            $this->command->warn('Aucun locataire trouvé. Veuillez d\'abord exécuter le LocataireSeeder.');
            return;
        }

        if ($unites->isEmpty()) {
            $this->command->warn('Aucune unité vacante trouvée. Veuillez d\'abord exécuter le UniteSeeder.');
            return;
        }

        $this->command->info('Création de baux de test...');

        $modes = ['virement', 'cheque', 'especes'];
        $statuts = ['actif', 'en_attente', 'resilie'];

        foreach ($unites as $index => $unite) {
            if (!isset($locataires[$index])) break;

            $locataire = $locataires[$index];
            $dateDebut = Carbon::now()->subMonths(rand(1, 12));
            $duree = rand(6, 24);

            $bail = Bail::create([
                'numero_bail' => 'BAIL-' . date('Y') . '-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'locataire_id' => $locataire->id,
                'unite_id' => $unite->id,
                'date_debut' => $dateDebut->format('Y-m-d'),
                'date_fin' => $dateDebut->copy()->addMonths($duree)->format('Y-m-d'),
                'duree' => $duree,
                'montant_loyer' => rand(3000, 15000),
                'charges' => rand(200, 1000),
                'depot_garantie' => rand(5000, 20000),
                'mode_paiement' => $modes[array_rand($modes)],
                'renouvellement_auto' => (bool) rand(0, 1),
                'clause_particuliere' => 'Clause particulière pour le bail ' . ($index + 1),
                'observations' => 'Observations pour le bail ' . ($index + 1),
                'statut' => $statuts[array_rand($statuts)],
            ]);

            // Mettre à jour l'unité
            $unite->update([
                'statut' => 'loue',
                'locataire_actuel_id' => $locataire->id,
                'bail_actuel_id' => $bail->id,
                'date_entree_actuelle' => $dateDebut->format('Y-m-d'),
            ]);

            $this->command->info("✓ Bail créé: {$bail->numero_bail} - Locataire: {$locataire->nom} - Unité: {$unite->numero_unite}");
        }

        $this->command->info('Baux de test créés avec succès!');
    }
}
