<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class CommercialUserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'commercial@test.com'],
            [
                'name' => 'Commercial User',
                'password' => bcrypt('password'),
            ]
        );

        $user->assignRole('commercial');
        
        $this->command->info('Commercial user created: commercial@test.com / password');
    }
}
