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
        // Check if mandat_id exists and remove it
        if (Schema::hasColumn('unites_proprietaires', 'mandat_id')) {
            Schema::table('unites_proprietaires', function (Blueprint $table) {
                // Drop foreign key constraint if exists
                try {
                    $table->dropForeign(['mandat_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, ignore
                }
                $table->dropColumn('mandat_id');
            });
        }
        
        // Ensure unite_id exists (should already be there from previous migrations)
        if (!Schema::hasColumn('unites_proprietaires', 'unite_id')) {
            Schema::table('unites_proprietaires', function (Blueprint $table) {
                $table->foreignId('unite_id')->after('id')->constrained('unites')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('unites_proprietaires', 'mandat_id')) {
            Schema::table('unites_proprietaires', function (Blueprint $table) {
                $table->foreignId('mandat_id')->after('id')->nullable()->constrained('mandats_gestion')->onDelete('cascade');
            });
        }
    }
};
