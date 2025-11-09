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
        Schema::table('locataires', function (Blueprint $table) {
            $table->string('nom_ar')->nullable()->after('nom');
            $table->string('prenom_ar')->nullable()->after('prenom');
            $table->text('adresse_ar')->nullable()->after('adresse_actuelle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locataires', function (Blueprint $table) {
            $table->dropColumn(['nom_ar', 'prenom_ar', 'adresse_ar']);
        });
    }
};
