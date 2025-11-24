<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('interventions', function (Blueprint $table) {
            $table->id();
            // Lien optionnel avec les entités existantes
            $table->foreignId('bail_id')->nullable()->constrained('baux')->nullOnDelete();
            $table->foreignId('locataire_id')->nullable()->constrained('locataires')->nullOnDelete();
            $table->foreignId('proprietaire_id')->nullable()->constrained('proprietaires')->nullOnDelete();
            $table->foreignId('prestataire_id')->nullable()->constrained('prestataires')->nullOnDelete();
            $table->foreignId('reclamation_id')->nullable()->constrained('reclamations')->nullOnDelete();

            // 1. Demandeur (libre) - ces infos ne dupliquent pas les tables référencées ci-dessus
            $table->string('demandeur_nom_societe')->nullable();
            $table->string('demandeur_service')->nullable(); // Service / Appartement / Bureau
            $table->string('demandeur_telephone')->nullable();
            $table->string('demandeur_email')->nullable();

            // 2. Date & Urgence
            $table->date('date_demande')->nullable();
            $table->string('urgence')->default('normal'); // urgent, normal, planifie

            // 3. Description du problème
            $table->string('nature_probleme')->nullable();
            $table->string('localisation')->nullable();
            $table->text('symptomes')->nullable();
            $table->text('pieces_materiel')->nullable();

            // 4. Actions déjà effectuées
            $table->text('actions_effectuees')->nullable();

            // 5. Technicien assigné (prestataire_id) + Planification
            $table->date('date_planifiee')->nullable();

            // Statut de suivi
            $table->string('status')->default('ouvert'); // ouvert, planifie, en_cours, resolu, ferme, annule

            $table->timestamps();

            $table->index(['urgence','status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interventions');
    }
};
