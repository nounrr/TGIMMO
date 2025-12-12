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
        Schema::create('franchise_bail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bail_id')->constrained('baux')->onDelete('cascade');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->decimal('pourcentage_remise', 5, 2)->default(0); // 0.00 à 100.00
            $table->text('motif')->nullable();
            $table->timestamps();
            
            // Index pour recherche par bail et dates
            $table->index(['bail_id', 'date_debut', 'date_fin']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('franchise_bail');
    }
};
