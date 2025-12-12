<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $permissions = [
            'approches_locataires.view',
            'approches_locataires.create',
            'approches_locataires.update',
            'approches_proprietaires.view',
            'approches_proprietaires.create',
            'approches_proprietaires.update',
        ];

        foreach ($permissions as $permName) {
            $perm = DB::table('permissions')->where('name', $permName)->first();
            if ($perm) {
                // Detach from roles
                DB::table('role_has_permissions')->where('permission_id', $perm->id)->delete();
                // Detach from users (model_has_permissions)
                DB::table('model_has_permissions')->where('permission_id', $perm->id)->delete();
                
                // Delete permission
                DB::table('permissions')->where('id', $perm->id)->delete();
            }
        }

        // Clear cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed as we are deleting duplicates
    }
};
