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
        Schema::table('mandats_gestion', function (Blueprint $table) {
            \DB::statement("ALTER TABLE mandats_gestion MODIFY COLUMN statut ENUM('brouillon', 'en_validation', 'signe', 'actif', 'resilie', 'modifier', 'inactif', 'en_attente') DEFAULT 'brouillon'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mandats_gestion', function (Blueprint $table) {
            \DB::statement("ALTER TABLE mandats_gestion MODIFY COLUMN statut ENUM('brouillon', 'en_validation', 'signe', 'actif', 'resilie') DEFAULT 'brouillon'");
        });
    }
};
