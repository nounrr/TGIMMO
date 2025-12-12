<?php
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

try {
    echo "--- FIXING PERMISSIONS IN PROD ---\n";
    
    // 1. Clear Cache
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    echo "1. Cache cleared.\n";

    // 2. Ensure Admin Role (API)
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
    echo "2. Admin Role (api) ID: " . $adminRole->id . "\n";

    // 3. Check specific permission 'users.view'
    $p = Permission::where('name', 'users.view')->where('guard_name', 'api')->first();
    if (!$p) {
        echo "WARNING: 'users.view' permission NOT FOUND. Creating it...\n";
        Permission::create(['name' => 'users.view', 'guard_name' => 'api']);
    } else {
        echo "3. 'users.view' permission exists.\n";
    }

    // 4. Get all permissions (API)
    $perms = Permission::where('guard_name', 'api')->get();
    echo "4. Found " . $perms->count() . " permissions (api).\n";
    
    if ($perms->count() < 5) {
        echo "CRITICAL WARNING: Very few permissions found. You must run 'php artisan db:seed --class=RolePermissionSeeder'\n";
    }

    // 5. Sync Permissions to Admin (Force all permissions to admin)
    // This ensures admin has EVERYTHING
    $adminRole->syncPermissions($perms);
    echo "5. Synced all " . $perms->count() . " permissions to Admin role.\n";

    // 6. Check User 1
    $user = User::find(1);
    if ($user) {
        echo "6. Checking User 1...\n";
        
        // Remove 'web' admin role if exists (cleanup)
        $webAdmin = Role::where('name', 'admin')->where('guard_name', 'web')->first();
        if ($webAdmin && $user->hasRole($webAdmin)) {
            $user->removeRole($webAdmin);
            echo "   - Removed 'web' admin role (cleanup).\n";
        }

        // Ensure user has the API role
        if (!$user->hasRole('admin', 'api')) {
            $user->assignRole($adminRole);
            echo "   - Assigned admin (api) role to User 1.\n";
        } else {
            echo "   - User 1 already has admin (api) role.\n";
        }
        
        // Verify
        $user->refresh(); // Reload relations
        echo "   - User 1 can users.view? " . ($user->can('users.view') ? 'YES' : 'NO') . "\n";
    } else {
        echo "User 1 not found.\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
