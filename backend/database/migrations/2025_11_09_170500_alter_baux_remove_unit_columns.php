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
        Schema::table('baux', function (Blueprint $table) {
            // Drop columns that duplicate data already stored in unites
            if (Schema::hasColumn('baux', 'type_bien')) $table->dropColumn('type_bien');
            if (Schema::hasColumn('baux', 'adresse_bien')) $table->dropColumn('adresse_bien');
            if (Schema::hasColumn('baux', 'superficie')) $table->dropColumn('superficie');
            if (Schema::hasColumn('baux', 'etage_bloc')) $table->dropColumn('etage_bloc');
            if (Schema::hasColumn('baux', 'nombre_pieces')) $table->dropColumn('nombre_pieces');
            if (Schema::hasColumn('baux', 'nombre_sdb')) $table->dropColumn('nombre_sdb');
            if (Schema::hasColumn('baux', 'garage')) $table->dropColumn('garage');
            if (Schema::hasColumn('baux', 'equipements')) $table->dropColumn('equipements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('baux', function (Blueprint $table) {
            // Recreate the dropped columns (definitions mirror original migration)
            $table->enum('type_bien', ['appartement', 'bureau', 'local_commercial', 'autre'])->default('appartement');
            $table->string('adresse_bien');
            $table->decimal('superficie', 10, 2)->nullable();
            $table->string('etage_bloc')->nullable();
            $table->integer('nombre_pieces')->nullable();
            $table->integer('nombre_sdb')->nullable();
            $table->boolean('garage')->default(false);
            $table->json('equipements')->nullable();
        });
    }
};
