<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unite;

class UniteSeeder extends Seeder
{
    public function run(): void
    {
        Unite::factory(25)->create();
    }
}
