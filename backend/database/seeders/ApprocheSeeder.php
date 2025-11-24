<?php

namespace Database\Seeders;

use App\Models\ApprocheLocataire;
use App\Models\ApprocheProprietaire;
use App\Models\Locataire;
use App\Models\Proprietaire;
use Illuminate\Database\Seeder;

class ApprocheSeeder extends Seeder
{
    public function run(): void
    {
        $locataireNotes = [
            'Relance sur le renouvellement de bail et proposition de revision douce.',
            'Presentation dune offre pack eco pour reduire les charges locatives.',
            'Suivi de satisfaction apres intervention recente sur le chauffage.',
        ];

        $proprietaireNotes = [
            'Proposition de valorisation du bien avec un rafraichissement des parties communes.',
            'Point trimestriel sur le taux doccupation et recommandations de loyers.',
            'Mise en avant dun nouveau locataire potentiel pour lunite vacante.',
        ];

        // Approches locataires (prend les 3 premiers si dispo)
        $locataires = Locataire::take(3)->get();
        foreach ($locataires as $index => $locataire) {
            ApprocheLocataire::create([
                'locataire_id' => $locataire->id,
                'description' => $locataireNotes[$index % count($locataireNotes)],
            ]);
        }

        // Approches propriétaires (prend les 3 premiers si dispo)
        $proprietaires = Proprietaire::take(3)->get();
        foreach ($proprietaires as $index => $proprietaire) {
            ApprocheProprietaire::create([
                'proprietaire_id' => $proprietaire->id,
                'description' => $proprietaireNotes[$index % count($proprietaireNotes)],
            ]);
        }
    }
}
