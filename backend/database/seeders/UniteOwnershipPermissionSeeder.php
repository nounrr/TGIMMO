<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UniteOwnershipPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [
            'unites.ownership.view',
            'unites.ownership.manage', // Covers create/update/delete of ownership
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
