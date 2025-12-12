<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        
        if (empty($tableNames)) {
             // Fallback if config not loaded (should not happen in artisan migrate)
             $tableNames = [
                 'roles' => 'roles',
                 'permissions' => 'permissions',
             ];
        }

        $tables = [$tableNames['roles'], $tableNames['permissions'], 'users'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $afterColumn = ($tableName === 'users') ? 'password' : 'guard_name';
                // Check if guard_name exists for roles/permissions, otherwise fallback
                if ($tableName !== 'users' && !Schema::hasColumn($tableName, 'guard_name')) {
                    $afterColumn = 'id'; 
                }

                $table->text('status_add_allowed')->nullable()->after($afterColumn);
                $table->text('status_edit_allowed')->nullable()->after('status_add_allowed');
                $table->text('status_view_allowed')->nullable()->after('status_edit_allowed');
                $table->text('status_delete_allowed')->nullable()->after('status_view_allowed');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableNames = config('permission.table_names');
        
        if (empty($tableNames)) {
             $tableNames = [
                 'roles' => 'roles',
                 'permissions' => 'permissions',
             ];
        }

        $tables = [$tableNames['roles'], $tableNames['permissions'], 'users'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn([
                    'status_add_allowed',
                    'status_edit_allowed',
                    'status_view_allowed',
                    'status_delete_allowed'
                ]);
            });
        }
    }
};
