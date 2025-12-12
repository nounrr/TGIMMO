<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class GedPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'ged.view',
            'ged.upload',
            'ged.update',
            'ged.delete',
            'ged.link',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        // Assign to roles if they exist
        $admin = Role::where(['name' => 'admin', 'guard_name' => 'api'])->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        $employe = Role::where(['name' => 'employe', 'guard_name' => 'api'])->first();
        if ($employe) {
            // Employees can view and upload by default; adjust as needed
            $employe->givePermissionTo(['ged.view', 'ged.upload']);
        }
    }
}
