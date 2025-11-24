<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PaiementPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [
            'paiements.view',
            'paiements.create',
            'paiements.update',
            'paiements.delete',
        ];

        foreach ($perms as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->givePermissionTo($perms);
        }
    }
}
