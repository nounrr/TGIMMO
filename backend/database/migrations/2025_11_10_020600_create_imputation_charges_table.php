<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('imputation_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->nullable()->constrained('interventions')->nullOnDelete();
            $table->foreignId('facture_id')->nullable()->constrained('factures')->nullOnDelete();
            $table->foreignId('unite_id')->constrained('unites')->cascadeOnDelete();
            $table->foreignId('proprietaire_id')->nullable()->constrained('proprietaires')->nullOnDelete();
            $table->foreignId('locataire_id')->nullable()->constrained('locataires')->nullOnDelete();
            $table->string('charge_to')->default('proprietaire');
            $table->decimal('montant', 12, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['charge_to','unite_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imputation_charges');
    }
};
