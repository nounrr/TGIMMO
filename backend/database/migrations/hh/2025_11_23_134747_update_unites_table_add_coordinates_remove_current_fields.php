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
        if (!Schema::hasColumn('unites', 'coordonnees_gps')) {
            Schema::table('unites', function (Blueprint $table) {
                $table->string('coordonnees_gps')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('unites', 'coordonnees_gps')) {
            Schema::table('unites', function (Blueprint $table) {
                $table->dropColumn('coordonnees_gps');
            });
        }
    }
};
