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
            if (!Schema::hasColumn('locataires', 'nom_ar')) {
                $table->string('nom_ar')->nullable();
            }
            if (!Schema::hasColumn('locataires', 'prenom_ar')) {
                $table->string('prenom_ar')->nullable();
            }
            if (!Schema::hasColumn('locataires', 'adresse_ar')) {
                $table->text('adresse_ar')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $toDrop = collect(['nom_ar', 'prenom_ar', 'adresse_ar'])
            ->filter(fn ($col) => Schema::hasColumn('locataires', $col))
            ->all();

        if (!empty($toDrop)) {
            Schema::table('locataires', function (Blueprint $table) use ($toDrop) {
                $table->dropColumn($toDrop);
            });
        }
    }
};
