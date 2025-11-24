<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class WorkflowPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $perms = [
            'devis.view','devis.create','devis.update','devis.delete',
            'factures.view','factures.create','factures.update','factures.delete',
            'documents.upload','documents.delete',
        ];
        foreach ($perms as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'api']);
        }
        $admin = Role::where('name','admin')->first();
        if ($admin) $admin->givePermissionTo($perms);
    }
}
