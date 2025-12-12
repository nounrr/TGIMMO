<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class MissingPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            // LiquidationPermissionSeeder::class,
            // StatusPermissionSeeder::class,
            GedPermissionSeeder::class,
        ]);
    }
}
