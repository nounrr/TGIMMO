<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('imputation_charges', function (Blueprint $table) {
            if (Schema::hasColumn('imputation_charges','bail_id')) {
                $table->dropForeign(['bail_id']);
                $table->dropColumn('bail_id');
            }
            if (Schema::hasColumn('imputation_charges','facture_id')) {
                $table->dropForeign(['facture_id']);
                $table->dropColumn('facture_id');
            }
            if (Schema::hasColumn('imputation_charges','unite_id')) {
                $table->dropForeign(['unite_id']);
                $table->dropColumn('unite_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('imputation_charges', function (Blueprint $table) {
            if (!Schema::hasColumn('imputation_charges','bail_id')) {
                $table->foreignId('bail_id')->nullable()->constrained('baux')->onDelete('set null');
            }
            if (!Schema::hasColumn('imputation_charges','facture_id')) {
                $table->foreignId('facture_id')->nullable()->constrained('factures')->nullOnDelete();
            }
            if (!Schema::hasColumn('imputation_charges','unite_id')) {
                $table->foreignId('unite_id')->nullable()->constrained('unites')->nullOnDelete();
            }
        });
    }
};