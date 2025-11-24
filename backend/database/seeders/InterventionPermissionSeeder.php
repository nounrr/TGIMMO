<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class InterventionPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [
            'interventions.view','interventions.create','interventions.update','interventions.delete',
        ];

        foreach ($perms as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        $admin = Role::where('name','admin')->first();
        if ($admin) {
            $admin->givePermissionTo($perms);
        }
    }
}
