<?php

namespace Database\Seeders;

use App\Models\Proprietaire;
use Illuminate\Database\Seeder;

class ProprietaireSeeder extends Seeder
{
    public function run(): void
    {
        Proprietaire::factory()->count(15)->create();
    }
}
