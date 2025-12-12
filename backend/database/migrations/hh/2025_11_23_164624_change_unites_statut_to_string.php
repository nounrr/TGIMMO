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
        Schema::table('unites', function (Blueprint $table) {
            // Change statut column to string to allow more values like 'en_negociation'
            $table->string('statut', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            // Revert back to enum if needed (be careful with data loss if values outside enum exist)
            // We can't easily revert if we have 'en_negociation', so we might leave it as string or try to revert to enum
            // $table->enum('statut', ['vacant','loue','maintenance','reserve'])->default('vacant')->change();
        });
    }
};
