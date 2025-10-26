<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Prestataire;

class PrestataireSeeder extends Seeder
{
    public function run(): void
    {
        Prestataire::factory()->count(30)->create();
    }
}
