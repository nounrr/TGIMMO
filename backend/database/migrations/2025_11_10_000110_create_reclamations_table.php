<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reclamations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bail_id')->constrained('baux')->cascadeOnDelete();
            $table->foreignId('reclamation_type_id')->constrained('reclamation_types')->restrictOnDelete();
            $table->text('description');
            $table->string('source')->nullable(); // locataire, inspection, interne...
            $table->string('status')->default('ouvert'); // ouvert, en_cours, resolu, ferme
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reclamations');
    }
};
