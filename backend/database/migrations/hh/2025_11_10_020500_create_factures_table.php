<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('intervention_id')->nullable()->constrained('interventions')->nullOnDelete();
            $table->foreignId('prestataire_id')->nullable()->constrained('prestataires')->nullOnDelete();
            $table->string('numero')->nullable();
            $table->date('date')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('montant_ht', 12, 2)->default(0);
            $table->decimal('tva', 5, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->string('status')->default('emise');
            $table->date('paid_at')->nullable();
            $table->timestamps();
            $table->index(['status','prestataire_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
