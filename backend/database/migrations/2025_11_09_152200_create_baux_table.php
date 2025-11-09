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
        Schema::create('baux', function (Blueprint $table) {
            $table->id();
            
            // Identifiants et références
            $table->string('numero_bail')->unique();
            $table->foreignId('locataire_id')->constrained('locataires')->onDelete('cascade');
            $table->foreignId('unite_id')->constrained('unites')->onDelete('cascade');
            
            // Informations du bien
            $table->enum('type_bien', ['appartement', 'bureau', 'local_commercial', 'autre'])->default('appartement');
            $table->string('adresse_bien');
            $table->decimal('superficie', 10, 2)->nullable();
            $table->string('etage_bloc')->nullable();
            $table->integer('nombre_pieces')->nullable();
            $table->integer('nombre_sdb')->nullable();
            $table->boolean('garage')->default(false);
            
            // Dates et durée
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->integer('duree')->nullable()->comment('Durée en mois');
            
            // Aspects financiers
            $table->decimal('montant_loyer', 10, 2);
            $table->decimal('charges', 10, 2)->default(0);
            $table->decimal('depot_garantie', 10, 2)->default(0);
            $table->enum('mode_paiement', ['virement', 'cheque', 'especes'])->default('virement');
            
            // Renouvellement et clauses
            $table->boolean('renouvellement_auto')->default(false);
            $table->text('clause_particuliere')->nullable();
            
            // Équipements et observations
            $table->json('equipements')->nullable();
            $table->text('observations')->nullable();
            
            // Statut
            $table->enum('statut', ['actif', 'en_attente', 'resilie'])->default('en_attente');
            
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index(['locataire_id', 'statut']);
            $table->index(['unite_id', 'statut']);
            $table->index('date_debut');
            $table->index('date_fin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('baux');
    }
};
