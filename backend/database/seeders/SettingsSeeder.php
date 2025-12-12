<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'agency_capital'],
            [
                'value' => '100.000,00',
                'group' => 'agency'
            ]
        );
    }
}
