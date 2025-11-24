<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->constrained('interventions')->cascadeOnDelete();
            $table->foreignId('prestataire_id')->nullable()->constrained('prestataires')->nullOnDelete();
            $table->string('numero')->nullable();
            $table->date('date_proposition')->nullable();
            $table->decimal('montant_ht', 12, 2)->default(0);
            $table->decimal('tva', 5, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->date('valid_until')->nullable();
            $table->string('status')->default('propose');
            $table->timestamps();
            $table->index(['status','prestataire_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis');
    }
};
