<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prestataires', function (Blueprint $table) {
            $table->id();
            $table->string('nom_raison');
            $table->string('adresse')->nullable();
            $table->string('telephone', 50)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('rc', 50)->nullable();
            $table->string('ifiscale', 50)->nullable();
            $table->string('ice', 50)->nullable();
            $table->string('domaine_activite', 200)->nullable();
            $table->string('contact_nom', 150)->nullable();
            $table->string('rib', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestataires');
    }
};
