<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Disable foreign key checks to allow dropping tables with dependencies
        Schema::disableForeignKeyConstraints();

        // 1. Drop existing tables to recreate them cleanly
        Schema::dropIfExists('unites_proprietaires');
        Schema::dropIfExists('mandats_gestion');

        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();

        // 2. Create mandats_gestion table
        Schema::create('mandats_gestion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unite_id')->constrained('unites')->onDelete('cascade');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['actif', 'inactif', 'resilie', 'en_attente', 'signe', 'brouillon'])->default('brouillon');
            
            // Additional fields often needed for Mandats
            $table->string('reference')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
        });

        // 3. Create unites_proprietaires table
        Schema::create('unites_proprietaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mandat_id')->constrained('mandats_gestion')->onDelete('cascade');
            $table->foreignId('proprietaire_id')->constrained('proprietaires')->onDelete('cascade');
            
            // Ownership details
            $table->integer('part_numerateur')->default(1);
            $table->integer('part_denominateur')->default(1);
            $table->decimal('pourcentage', 5, 2)->default(100.00); // e.g. 100.00, 50.00
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('unites_proprietaires');
        Schema::dropIfExists('mandats_gestion');
        Schema::enableForeignKeyConstraints();
    }
};
