<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->constrained('interventions')->cascadeOnDelete();
            $table->string('recepteur_type')->nullable();
            $table->unsignedBigInteger('recepteur_id')->nullable();
            $table->date('date_reception')->nullable();
            $table->string('statut')->default('acceptee');
            $table->text('observations')->nullable();
            $table->timestamps();
            $table->index(['recepteur_type','recepteur_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receptions');
    }
};
