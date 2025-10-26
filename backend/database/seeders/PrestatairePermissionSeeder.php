<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PrestatairePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $guard = 'api';
        $perms = [
            'prestataires.view',
            'prestataires.create',
            'prestataires.update',
            'prestataires.delete',
        ];

        foreach ($perms as $name) {
            Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => $guard,
            ]);
        }

        // Assigner automatiquement au rôle admin si présent
        $admin = Role::where('name', 'admin')->where('guard_name', $guard)->first();
        if ($admin) {
            $admin->givePermissionTo($perms);
        }
    }
}
