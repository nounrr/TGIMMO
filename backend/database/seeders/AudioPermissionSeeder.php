<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AudioPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permission
        $permission = Permission::firstOrCreate(['name' => 'approches.audio', 'guard_name' => 'api']);

        // Assign to admin role
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permission);
        }
        
        // Assign to commercial role (optional, depending on requirements, but usually they need it)
        $commercialRole = Role::where('name', 'commercial')->first();
        if ($commercialRole) {
            $commercialRole->givePermissionTo($permission);
        }
    }
}
