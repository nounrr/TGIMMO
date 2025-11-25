<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin par défaut
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin Super',
                'fonction' => 'Administrateur',
                'service' => 'IT',
                'telephone_interne' => '1000',
                'statut' => 'actif',
                'password' => Hash::make('ChangeMe123!'),
            ]
        );

        // Assigner rôle admin
        if (!$admin->hasRole('admin')) {
            $admin->assignRole('admin');
        }

        // Créer beaucoup d'employés (ex: 20)


        // for ($i = 1; $i <= 20; $i++) {
        //     $email = "employe{$i}@example.com";
        //     $user = User::firstOrCreate(
        //         ['email' => $email],
        //         [
        //             'name' => "Employe {$i}",
        //             'fonction' => 'Employé',
        //             'service' => 'Opérations',
        //             'telephone_interne' => (string)(1000 + $i),
        //             'statut' => 'actif',
        //             'password' => Hash::make('ChangeMe123!'),
        //         ]
        //     );

        //     if (!$user->hasRole('employe')) {
        //         $user->assignRole('employe');
        //     }
        // }
    }
}
