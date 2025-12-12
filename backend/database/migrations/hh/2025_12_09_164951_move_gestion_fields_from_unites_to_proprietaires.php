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
            $table->dropColumn([
                'tva_applicable',
                'tva_taux',
                'mode_versement',
                'lieu_signature',
                'date_signature',
                'periodicite_releve',
                'assiette_honoraires'
            ]);
        });

        Schema::table('proprietaires', function (Blueprint $table) {
            $table->string('assiette_honoraires')->nullable();
            $table->string('periodicite_releve')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proprietaires', function (Blueprint $table) {
            $table->dropColumn(['assiette_honoraires', 'periodicite_releve']);
        });

        Schema::table('unites', function (Blueprint $table) {
            $table->boolean('tva_applicable')->default(false);
            $table->decimal('tva_taux', 5, 2)->nullable();
            $table->string('mode_versement')->nullable();
            $table->string('lieu_signature')->nullable();
            $table->date('date_signature')->nullable();
            $table->string('periodicite_releve')->nullable();
            $table->string('assiette_honoraires')->nullable();
        });
    }
};
