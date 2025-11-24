<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class LiquidationPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'liquidations.view',
            'liquidations.create',
            'liquidations.update',
            'liquidations.delete',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'api']);
        }

        // Assign to admin
        $admin = Role::where('name', 'admin')->where('guard_name', 'api')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }
    }
}
