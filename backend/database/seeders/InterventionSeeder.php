<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Intervention;
use App\Models\Bail;
use App\Models\Locataire;
use App\Models\Proprietaire;
use App\Models\Prestataire;
use App\Models\Reclamation;
use Faker\Factory as Faker;

class InterventionSeeder extends Seeder
{
    public function run()
    {
        // 1. Supprimer les anciennes interventions
        Intervention::query()->delete();

        $faker = Faker::create('fr_FR');

        // Récupérer des IDs existants pour les relations
        $bauxIds = Bail::pluck('id')->toArray();
        $prestatairesIds = Prestataire::pluck('id')->toArray();
        $reclamationsIds = Reclamation::pluck('id')->toArray();

        $urgences = ['urgent', 'normal', 'planifie'];
        $statuses = ['ouvert', 'planifie', 'en_cours', 'resolu', 'ferme', 'annule'];

        // 2. Créer 15 nouvelles interventions
        for ($i = 0; $i < 15; $i++) {
            $status = $faker->randomElement($statuses);
            $urgence = $faker->randomElement($urgences);
            
            // Logique pour les dates cohérentes
            $dateDemande = $faker->dateTimeBetween('-3 months', 'now');
            $datePlanifiee = null;
            
            if (in_array($status, ['planifie', 'en_cours', 'resolu', 'ferme'])) {
                $datePlanifiee = $faker->dateTimeBetween($dateDemande, '+1 month');
            }

            Intervention::create([
                'bail_id' => !empty($bauxIds) ? $faker->randomElement($bauxIds) : null,
                'prestataire_id' => !empty($prestatairesIds) ? $faker->randomElement($prestatairesIds) : null,
                'reclamation_id' => !empty($reclamationsIds) && $faker->boolean(30) ? $faker->randomElement($reclamationsIds) : null,
                
                'demandeur_nom_societe' => $faker->company,
                'demandeur_service' => $faker->randomElement(['Service Technique', 'Conciergerie', 'Syndic', 'Locataire']),
                'demandeur_telephone' => $faker->phoneNumber,
                'demandeur_email' => $faker->email,
                
                'date_demande' => $dateDemande,
                'urgence' => $urgence,
                
                'nature_probleme' => $faker->sentence(4),
                'localisation' => $faker->randomElement(['Cuisine', 'Salle de bain', 'Salon', 'Entrée', 'Toiture', 'Sous-sol']),
                'symptomes' => $faker->paragraph,
                'pieces_materiel' => $faker->boolean ? $faker->words(3, true) : null,
                
                'actions_effectuees' => $status === 'resolu' || $status === 'ferme' ? $faker->paragraph : null,
                
                'date_planifiee' => $datePlanifiee,
                'status' => $status,
            ]);
        }
    }
}
