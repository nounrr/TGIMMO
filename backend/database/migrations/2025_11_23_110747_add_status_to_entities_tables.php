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
        if (!Schema::hasColumn('locataires', 'statut')) {
            Schema::table('locataires', function (Blueprint $table) {
                $table->string('statut')->nullable();
            });
        }

        if (!Schema::hasColumn('proprietaires', 'statut')) {
            Schema::table('proprietaires', function (Blueprint $table) {
                $table->string('statut')->nullable();
            });
        }

        if (!Schema::hasColumn('unites', 'statut')) {
            Schema::table('unites', function (Blueprint $table) {
                $table->string('statut')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locataires', function (Blueprint $table) {
            $table->dropColumn('statut');
        });

        Schema::table('proprietaires', function (Blueprint $table) {
            $table->dropColumn('statut');
        });

        Schema::table('unites', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
