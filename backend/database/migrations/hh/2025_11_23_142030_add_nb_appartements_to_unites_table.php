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
        if (!Schema::hasColumn('unites', 'nb_appartements')) {
            Schema::table('unites', function (Blueprint $table) {
                $table->integer('nb_appartements')->nullable()->after('nb_sdb');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('unites', 'nb_appartements')) {
            Schema::table('unites', function (Blueprint $table) {
                $table->dropColumn('nb_appartements');
            });
        }
    }
};
