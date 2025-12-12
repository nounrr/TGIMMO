<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('realisations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->constrained('interventions')->cascadeOnDelete();
            $table->string('type')->default('prestataire');
            $table->date('date_prevue')->nullable();
            $table->date('date_reelle')->nullable();
            $table->string('statut')->default('planifie');
            $table->decimal('cout_reel', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisations');
    }
};
