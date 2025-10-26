<?php

namespace Database\Seeders;

use App\Models\Locataire;
use Illuminate\Database\Seeder;

class LocataireSeeder extends Seeder
{
    public function run(): void
    {
        // Crée 20 locataires mixtes (personnes et sociétés)
        Locataire::factory()->count(20)->create();
    }
}
