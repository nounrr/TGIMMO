<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('unites')) {
            Schema::create('unites', function (Blueprint $table) {
                $table->id();
                $table->string('numero_unite', 100);
                $table->string('adresse_complete', 255);
                $table->string('immeuble', 150)->nullable();
                $table->string('bloc', 100)->nullable();
                $table->string('etage', 50)->nullable();
                $table->enum('type_unite', ['appartement','bureau','local_commercial','garage','autre']);
                $table->decimal('superficie_m2', 10, 2)->nullable();
                $table->integer('nb_pieces')->nullable();
                $table->integer('nb_sdb')->nullable();
                $table->text('equipements')->nullable();
                $table->text('mobilier')->nullable();
                $table->enum('statut', ['vacant','loue','maintenance','reserve'])->default('vacant');
                // Relations actuelles
                $table->unsignedBigInteger('locataire_actuel_id')->nullable();
                $table->unsignedBigInteger('bail_actuel_id')->nullable(); // FK ajoutée ultérieurement quand baux existera
                $table->date('date_entree_actuelle')->nullable();
                $table->timestamps();

                $table->index(['numero_unite', 'type_unite'], 'idx_unite_ident');
                $table->index(['statut'], 'idx_unite_statut');
            });

            // Ajouter la contrainte vers locataires si la table existe
            if (Schema::hasTable('locataires')) {
                Schema::table('unites', function (Blueprint $table) {
                    $table->foreign('locataire_actuel_id')->references('id')->on('locataires')->nullOnDelete();
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('unites');
    }
};
