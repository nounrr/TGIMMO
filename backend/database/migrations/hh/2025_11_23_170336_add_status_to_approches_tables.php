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
        Schema::table('approche_locataires', function (Blueprint $table) {
            $table->string('statut')->nullable()->default('planifie');
        });

        Schema::table('approche_proprietaires', function (Blueprint $table) {
            $table->string('statut')->nullable()->default('planifie');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approche_locataires', function (Blueprint $table) {
            $table->dropColumn('statut');
        });

        Schema::table('approche_proprietaires', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
