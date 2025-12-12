<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update mandats_gestion statut enum
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE mandats_gestion MODIFY COLUMN statut ENUM('brouillon', 'en_validation', 'signe', 'actif', 'resilie', 'modifier') DEFAULT 'brouillon'");
        }

        // Add statut to unites_proprietaires
        Schema::table('unites_proprietaires', function (Blueprint $table) {
            $table->enum('statut', ['actif', 'modifier', 'archive'])->default('actif')->after('date_fin');
            $table->index('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            // Revert mandats_gestion statut (warning: 'modifier' values might cause issues if not handled)
            // We won't strictly revert data loss, just the schema if possible, but usually reverting enum removal is risky.
            // For safety, we keep 'modifier' in down or just leave it. 
            // But strictly speaking:
            // DB::statement("ALTER TABLE mandats_gestion MODIFY COLUMN statut ENUM('brouillon', 'en_validation', 'signe', 'actif', 'resilie') DEFAULT 'brouillon'");
        }

        Schema::table('unites_proprietaires', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
