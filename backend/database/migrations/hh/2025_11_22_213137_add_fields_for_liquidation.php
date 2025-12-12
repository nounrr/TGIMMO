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
        Schema::table('avenants_mandat', function (Blueprint $table) {
            $table->decimal('nouveau_taux_gestion', 5, 2)->nullable()->after('modifs_text');
        });

        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->enum('statut_paiement', ['non_paye', 'paye'])->default('non_paye')->after('montant');
            $table->date('date_paiement')->nullable()->after('statut_paiement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('avenants_mandat', function (Blueprint $table) {
            $table->dropColumn('nouveau_taux_gestion');
        });

        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->dropColumn(['statut_paiement', 'date_paiement']);
        });
    }
};
