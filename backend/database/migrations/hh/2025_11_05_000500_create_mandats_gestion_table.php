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
        Schema::create('mandats_gestion', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proprietaire_id');
            $table->string('reference', 80)->unique()->nullable();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->decimal('taux_gestion_pct', 5, 2)->nullable();
            $table->enum('assiette_honoraires', ['loyers_encaisse', 'loyers_factures'])->default('loyers_encaisse');
            $table->boolean('tva_applicable')->default(false);
            $table->decimal('tva_taux', 5, 2)->nullable();
            $table->decimal('frais_min_mensuel', 10, 2)->nullable();
            $table->enum('periodicite_releve', ['mensuel', 'trimestriel', 'annuel'])->default('trimestriel');
            $table->enum('charge_maintenance', ['proprietaire', 'gestionnaire', 'locataire', 'mixte'])->nullable();
            $table->enum('mode_versement', ['virement', 'cheque', 'especes', 'prelevement'])->nullable();
            $table->text('description_bien')->nullable();
            $table->enum('usage_bien', ['habitation', 'commercial', 'professionnel', 'autre'])->nullable();
            $table->text('pouvoirs_accordes')->nullable();
            $table->string('lieu_signature', 120)->nullable();
            $table->date('date_signature')->nullable();
            $table->enum('langue', ['ar', 'fr', 'ar_fr'])->nullable();
            $table->text('notes_clauses')->nullable();
            $table->enum('statut', ['brouillon', 'en_validation', 'signe', 'actif', 'resilie'])->default('brouillon');
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('proprietaire_id')->references('id')->on('proprietaires');
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['statut'], 'idx_mandat_statut');
            $table->index(['date_debut', 'date_fin'], 'idx_mandat_dates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mandats_gestion');
    }
};

















