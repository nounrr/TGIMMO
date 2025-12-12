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
        Schema::dropIfExists('avenants_mandat');

        Schema::create('avenants_mandat', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mandat_id');
            $table->unsignedBigInteger('unite_id');
            
            // Fields from mandats_gestion
            $table->string('reference', 80)->nullable(); // Not unique here as it might be same as mandat or versioned
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
            
            // Status matching mandats_gestion
            $table->enum('statut', ['brouillon', 'en_validation', 'signe', 'actif', 'resilie', 'modifier', 'inactif', 'en_attente'])->default('brouillon');
            
            // Doc fields
            $table->longText('doc_content')->nullable();
            $table->json('doc_variables')->nullable();
            $table->string('doc_template_key', 120)->nullable();

            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            // Foreign keys
            $table->foreign('mandat_id')->references('id')->on('mandats_gestion')->onDelete('cascade');
            $table->foreign('unite_id')->references('id')->on('unites');
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['mandat_id']);
            $table->index(['statut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('avenants_mandat');
    }
};
