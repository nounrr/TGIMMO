<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ApprocheLocataire;
use App\Models\ApprocheProprietaire;
use App\Models\Bail;
use App\Models\Intervention;
use App\Models\Locataire;
use App\Models\Prestataire;
use App\Models\Proprietaire;
use App\Models\Reclamation;
use App\Models\ReclamationType;
use App\Models\Unite;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CompleteApplicationSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        DB::table('role_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('model_has_permissions')->truncate();

        Intervention::truncate();
        Reclamation::truncate();
        ReclamationType::truncate();
        ApprocheLocataire::truncate();
        ApprocheProprietaire::truncate();
        Bail::truncate();
        Unite::truncate();
        Prestataire::truncate();
        Locataire::truncate();
        Proprietaire::truncate();
        User::truncate();
        Role::truncate();
        Permission::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->command->info('Tables nettoyees');

        $this->command->info('Creation des permissions et roles...');
        $this->call([
            RolePermissionSeeder::class,
            PrestatairePermissionSeeder::class,
            InterventionPermissionSeeder::class,
            ReclamationPermissionSeeder::class,
            WorkflowPermissionSeeder::class,
            ChargePermissionSeeder::class,
            PaiementPermissionSeeder::class,
            UniteOwnershipPermissionSeeder::class,
        ]);

        $this->command->info('Creation des utilisateurs...');
        $this->call(UserSeeder::class);

        $this->command->info('Creation des locataires...');
        $this->call(LocataireSeeder::class);

        $this->command->info('Creation des proprietaires...');
        $this->call(ProprietaireSeeder::class);

        $this->command->info('Creation des approches locataires/proprietaires...');
        $this->call(ApprocheSeeder::class);

        $this->command->info('Creation des unites...');
        $this->call(UniteSeeder::class);

        $this->command->info('Creation des prestataires...');
        $this->call(PrestataireSeeder::class);

        $this->command->info('Creation des baux...');
        if (Locataire::count() > 0 && Proprietaire::count() > 0 && Unite::count() > 0) {
            Bail::create([
                'numero_bail' => 'BAIL-2024-001',
                'unite_id' => Unite::first()->id,
                'locataire_id' => Locataire::first()->id,
                'date_debut' => '2024-01-01',
                'date_fin' => '2025-12-31',
                'duree' => 24,
                'montant_loyer' => 4500.00,
                'charges' => 300.00,
                'depot_garantie' => 9000.00,
                'statut' => 'actif',
            ]);

            if (Locataire::count() > 1 && Unite::count() > 1) {
                Bail::create([
                    'numero_bail' => 'BAIL-2024-002',
                    'unite_id' => Unite::skip(1)->first()->id,
                    'locataire_id' => Locataire::skip(1)->first()->id,
                    'date_debut' => '2024-03-01',
                    'date_fin' => '2026-02-28',
                    'duree' => 24,
                    'montant_loyer' => 6500.00,
                    'charges' => 450.00,
                    'depot_garantie' => 13000.00,
                    'statut' => 'actif',
                ]);
            }

            $this->command->info('   ' . Bail::count() . ' baux crees');
        }

        $this->command->info('Creation des types de reclamations...');
        ReclamationType::create(['name' => 'Fuite deau', 'description' => 'Problemes de plomberie']);
        ReclamationType::create(['name' => 'Panne electrique', 'description' => 'Problemes electriques']);
        ReclamationType::create(['name' => 'Chauffage/Climatisation', 'description' => 'Problemes de temperature']);
        ReclamationType::create(['name' => 'Nuisances sonores', 'description' => 'Bruit']);
        ReclamationType::create(['name' => 'Degradations', 'description' => 'Dommages materiels']);
        ReclamationType::create(['name' => 'Autre', 'description' => 'Autres types']);

        $this->command->info('Creation des reclamations...');
        if (Bail::count() > 0 && ReclamationType::count() > 0) {
            $bail = Bail::first();
            Reclamation::create([
                'bail_id' => $bail->id,
                'reclamation_type_id' => ReclamationType::first()->id,
                'status' => 'ouvert',
                'source' => 'email',
                'description' => 'Fuite importante sous levier de la cuisine.',
            ]);

            if (Bail::count() > 1 && ReclamationType::count() > 1) {
                $bail2 = Bail::skip(1)->first();
                Reclamation::create([
                    'bail_id' => $bail2->id,
                    'reclamation_type_id' => ReclamationType::skip(2)->first()->id,
                    'status' => 'ouvert',
                    'source' => 'telephone',
                    'description' => 'Le climatiseur ne fonctionne plus.',
                ]);
            }

            $this->command->info('   ' . Reclamation::count() . ' reclamations crees');
        }

        $this->command->info('Creation des interventions...');
        if (Bail::count() > 0 && Prestataire::count() > 0) {
            $bail = Bail::first();
            $prestataire = Prestataire::first();

            Intervention::create([
                'bail_id' => $bail->id,
                'locataire_id' => $bail->locataire_id,
                'prestataire_id' => $prestataire->id,
                'date_demande' => now()->subDays(2),
                'urgence' => 'urgent',
                'status' => 'en_cours',
                'nature_probleme' => 'Fuite deau cuisine',
                'localisation' => 'Cuisine - sous levier',
                'symptomes' => 'Fuite continue',
                'charge' => 850.00,
                'demandeur_telephone' => '+212611223344',
            ]);

            if (Bail::count() > 1 && Prestataire::count() > 1) {
                $bail2 = Bail::skip(1)->first();
                $prestataire2 = Prestataire::skip(1)->first();

                Intervention::create([
                    'bail_id' => $bail2->id,
                    'locataire_id' => $bail2->locataire_id,
                    'prestataire_id' => $prestataire2->id,
                    'date_demande' => now()->subDays(3),
                    'urgence' => 'normal',
                    'status' => 'planifie',
                    'nature_probleme' => 'Panne climatisation',
                    'localisation' => 'Salon principal',
                    'symptomes' => 'Climatiseur ne demarre plus',
                    'charge' => 1200.00,
                    'date_planifiee' => now()->addDays(2),
                    'demandeur_telephone' => '+212677889900',
                ]);

                Intervention::create([
                    'bail_id' => $bail->id,
                    'locataire_id' => $bail->locataire_id,
                    'prestataire_id' => $prestataire->id,
                    'date_demande' => now()->subDays(15),
                    'urgence' => 'planifie',
                    'status' => 'resolu',
                    'nature_probleme' => 'Rafraichissement peinture',
                    'localisation' => 'Chambre principale',
                    'symptomes' => 'Peinture ecaille',
                    'charge' => 2800.00,
                    'pieces_materiel' => 'Peinture acrylique 15L',
                    'actions_effectuees' => 'Application de 2 couches',
                    'demandeur_telephone' => '+212611223344',
                ]);
            }

            $this->command->info('   ' . Intervention::count() . ' interventions crees');
        }

        $this->command->info('');
        $this->command->info('Seeding complet termine !');
        $this->command->info('');
        $this->command->info('Resume:');
        $this->command->info('   Utilisateurs: ' . User::count());
        $this->command->info('   Proprietaires: ' . Proprietaire::count());
        $this->command->info('   Locataires: ' . Locataire::count());
        $this->command->info('   Approches locataires: ' . ApprocheLocataire::count());
        $this->command->info('   Approches proprietaires: ' . ApprocheProprietaire::count());
        $this->command->info('   Unites: ' . Unite::count());
        $this->command->info('   Baux: ' . Bail::count());
        $this->command->info('   Prestataires: ' . Prestataire::count());
        $this->command->info('   Reclamations: ' . Reclamation::count());
        $this->command->info('   Interventions: ' . Intervention::count());
        $this->command->info('');
    }
}
