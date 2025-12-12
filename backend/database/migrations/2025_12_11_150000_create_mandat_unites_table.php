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
        // Create pivot table for many-to-many relationship between mandats and unites
        Schema::create('mandat_unites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mandat_id')->constrained('mandats_gestion')->onDelete('cascade');
            $table->foreignId('unite_id')->constrained('unites')->onDelete('cascade');
            $table->timestamps();
            
            // Prevent duplicate mandat-unite pairs
            $table->unique(['mandat_id', 'unite_id']);
        });

        // Make unite_id nullable in mandats_gestion (will be deprecated)
        if (Schema::hasColumn('mandats_gestion', 'unite_id')) {
            Schema::table('mandats_gestion', function (Blueprint $table) {
                $table->foreignId('unite_id')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mandat_unites');
        
        if (Schema::hasColumn('mandats_gestion', 'unite_id')) {
            Schema::table('mandats_gestion', function (Blueprint $table) {
                $table->foreignId('unite_id')->nullable(false)->change();
            });
        }
    }
};
