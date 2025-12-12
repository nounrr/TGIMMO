<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, add unite_id column (nullable) if not exists
        if (!Schema::hasColumn('reclamations', 'unite_id')) {
            Schema::table('reclamations', function (Blueprint $table) {
                $table->unsignedBigInteger('unite_id')->nullable()->after('id');
            });
        }

        // Populate unite_id from baux only if bail_id still exists
        if (Schema::hasColumn('reclamations', 'bail_id')) {
            DB::statement('
                UPDATE reclamations r
                INNER JOIN baux b ON r.bail_id = b.id
                SET r.unite_id = b.unite_id
            ');
        }

        // Delete reclamations with invalid unite_id (unite_id not in unites table)
        DB::statement('
            DELETE FROM reclamations 
            WHERE unite_id NOT IN (SELECT id FROM unites) OR unite_id IS NULL
        ');

        // Now make unite_id non-nullable and add foreign key if not exists
        Schema::table('reclamations', function (Blueprint $table) {
            $table->unsignedBigInteger('unite_id')->nullable(false)->change();
            if (!$this->hasForeignKey('reclamations', 'reclamations_unite_id_foreign')) {
                $table->foreign('unite_id')->references('id')->on('unites')->cascadeOnDelete();
            }
        });

        // Finally, drop bail_id if exists
        if (Schema::hasColumn('reclamations', 'bail_id')) {
            Schema::table('reclamations', function (Blueprint $table) {
                $table->dropForeign(['bail_id']);
                $table->dropColumn('bail_id');
            });
        }
    }

    private function hasForeignKey($table, $key)
    {
        $conn = Schema::getConnection();
        $dbName = $conn->getDatabaseName();
        $count = $conn->select("
            SELECT COUNT(*) as count
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
        ", [$dbName, $table, $key]);
        return $count[0]->count > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add bail_id back
        Schema::table('reclamations', function (Blueprint $table) {
            $table->unsignedBigInteger('bail_id')->nullable()->after('id');
        });

        // Restore bail_id from unites (find a bail for each unite)
        DB::statement('
            UPDATE reclamations r
            INNER JOIN baux b ON r.unite_id = b.unite_id
            SET r.bail_id = b.id
            WHERE b.id = (
                SELECT MIN(id) FROM baux WHERE unite_id = r.unite_id
            )
        ');

        // Make bail_id non-nullable and add foreign key
        Schema::table('reclamations', function (Blueprint $table) {
            $table->unsignedBigInteger('bail_id')->nullable(false)->change();
            $table->foreign('bail_id')->references('id')->on('baux')->cascadeOnDelete();
        });

        // Drop unite_id
        Schema::table('reclamations', function (Blueprint $table) {
            $table->dropForeign(['unite_id']);
            $table->dropColumn('unite_id');
        });
    }
};
