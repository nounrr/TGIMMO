<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('imputation_charges', function (Blueprint $table) {
            // Add new payer columns
            $table->string('payer_type', 40)->nullable()->after('id_impute'); // locataire, proprietaire, societe
            $table->unsignedBigInteger('payer_id')->nullable()->after('payer_type');
            $table->index(['payer_type','payer_id']);
        });

        // Backfill payer_type from existing charge_to if column exists
        if (Schema::hasColumn('imputation_charges','charge_to')) {
            DB::table('imputation_charges')->whereNull('payer_type')->update([
                'payer_type' => DB::raw('charge_to')
            ]);
        }

        // Drop old charge_to column
        Schema::table('imputation_charges', function (Blueprint $table) {
            if (Schema::hasColumn('imputation_charges','charge_to')) {
                $table->dropColumn('charge_to');
            }
        });

        // Convert impute_a string to enum via raw statement (MySQL assumed)
        // Allowed values: bail, unite, intervention, reclamation, locataire, proprietaire, charge_libre
        if (Schema::hasColumn('imputation_charges','impute_a')) {
            DB::statement("ALTER TABLE imputation_charges MODIFY impute_a ENUM('bail','unite','intervention','reclamation','locataire','proprietaire','charge_libre') NULL");
        }
    }

    public function down(): void
    {
        // Recreate charge_to from payer_type (lossy if 'societe')
        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->string('charge_to',40)->nullable();
        });
        DB::table('imputation_charges')->whereNotNull('payer_type')->update([
            'charge_to' => DB::raw('payer_type')
        ]);

        Schema::table('imputation_charges', function (Blueprint $table) {
            if (Schema::hasColumn('imputation_charges','payer_type')) {
                $table->dropIndex(['payer_type','payer_id']);
                $table->dropColumn(['payer_type','payer_id']);
            }
        });
        // Return impute_a to VARCHAR
        DB::statement("ALTER TABLE imputation_charges MODIFY impute_a VARCHAR(40) NULL");
    }
};
