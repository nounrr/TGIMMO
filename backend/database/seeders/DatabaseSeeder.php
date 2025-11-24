<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Option 1: Seeding complet avec toutes les données de test
        // Décommentez cette ligne pour générer un jeu de données complet
        $this->call(CompleteApplicationSeeder::class);

        // Option 2: Seeding minimal (commenté par défaut)
        // Décommentez les lignes ci-dessous pour un seeding minimal
        /*
        $this->call([
            RolePermissionSeeder::class,
            PrestatairePermissionSeeder::class,
            ApprochePermissionSeeder::class,
            UserSeeder::class,
            LocataireSeeder::class,
            ProprietaireSeeder::class,
            UniteSeeder::class,
            PrestataireSeeder::class,
            ApprocheSeeder::class,
        ]);
        */
    }
}
