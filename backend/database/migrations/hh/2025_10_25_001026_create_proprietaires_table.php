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
        Schema::create('proprietaires', function (Blueprint $table) {
            $table->id();
            $table->string('nom_raison');
            $table->string('cin')->nullable();
            $table->string('rc')->nullable();
            $table->decimal('chiffre_affaires', 15, 2)->nullable();
            $table->string('ice')->nullable();
            $table->string('ifiscale')->nullable();
            $table->text('adresse')->nullable();
            $table->string('telephone')->nullable();
            $table->string('email')->nullable();
            $table->string('representant_nom')->nullable();
            $table->string('representant_fonction')->nullable();
            $table->string('representant_cin')->nullable();
            $table->string('type_proprietaire')->default('unique');
            $table->string('statut')->default('brouillon');
            $table->decimal('taux_gestion_tgi_pct', 5, 2)->nullable();
            $table->decimal('part_liquidation_pct', 5, 2)->nullable();
            $table->text('conditions_particulieres')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proprietaires');
    }
};
