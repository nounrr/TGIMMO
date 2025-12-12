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
        Schema::table('unites', function (Blueprint $table) {
            $table->decimal('taux_gestion_pct', 5, 2)->nullable();
            $table->enum('assiette_honoraires', ['loyers_encaisse', 'loyers_factures'])->default('loyers_encaisse');
            $table->boolean('tva_applicable')->default(false);
            $table->decimal('tva_taux', 5, 2)->nullable();
            $table->decimal('frais_min_mensuel', 10, 2)->nullable();
            $table->enum('periodicite_releve', ['mensuel', 'trimestriel', 'annuel'])->default('trimestriel');
            $table->enum('mode_versement', ['virement', 'cheque', 'especes', 'prelevement'])->nullable();
            $table->text('description_bien')->nullable();
            $table->enum('usage_bien', ['habitation', 'commercial', 'professionnel', 'autre'])->nullable();
            $table->text('pouvoirs_accordes')->nullable();
            $table->string('lieu_signature', 120)->nullable();
            $table->date('date_signature')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            $table->dropColumn([
                'taux_gestion_pct',
                'assiette_honoraires',
                'tva_applicable',
                'tva_taux',
                'frais_min_mensuel',
                'periodicite_releve',
                'mode_versement',
                'description_bien',
                'usage_bien',
                'pouvoirs_accordes',
                'lieu_signature',
                'date_signature',
            ]);
        });
    }
};
