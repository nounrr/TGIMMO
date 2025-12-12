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
        Schema::create('liquidations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedBigInteger('mandat_id')->nullable();
            $table->integer('mois');
            $table->integer('annee');
            $table->decimal('total_loyer', 15, 2)->default(0);
            $table->decimal('total_charges', 15, 2)->default(0);
            $table->decimal('total_honoraires', 15, 2)->default(0);
            $table->decimal('montant_net', 15, 2)->default(0);
            $table->date('date_liquidation');
            $table->enum('statut', ['brouillon', 'valide', 'paye'])->default('brouillon');
            $table->json('details')->nullable(); // Stores IDs of payments and charges included
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('proprietaire_id')->references('id')->on('proprietaires')->onDelete('cascade');
            $table->foreign('mandat_id')->references('id')->on('mandats_gestion')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['proprietaire_id', 'annee', 'mois']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('liquidations');
    }
};
