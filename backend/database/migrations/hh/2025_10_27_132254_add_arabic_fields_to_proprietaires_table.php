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
        Schema::table('proprietaires', function (Blueprint $table) {
            // Colonnes Arabes ajoutAces sans contrainte de position afin d'Aviter les erreurs si les colonnes de rA(c)fA(c)rence n'existent pas encore
            $table->string('nom_ar')->nullable();
            $table->string('prenom_ar')->nullable();
            $table->text('adresse_ar')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proprietaires', function (Blueprint $table) {
            $table->dropColumn(['nom_ar', 'prenom_ar', 'adresse_ar']);
        });
    }
};
