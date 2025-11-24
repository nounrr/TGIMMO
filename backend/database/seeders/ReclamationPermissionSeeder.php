<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ReclamationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [
            'reclamations.view','reclamations.create','reclamations.update','reclamations.delete',
            'reclamation-types.view','reclamation-types.create','reclamation-types.update','reclamation-types.delete',
            'reclamations.justifications.upload','reclamations.justifications.delete',
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
