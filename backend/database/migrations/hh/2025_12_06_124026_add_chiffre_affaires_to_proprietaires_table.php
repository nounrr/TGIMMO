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
            $table->decimal('chiffre_affaires', 15, 2)->nullable()->after('rc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proprietaires', function (Blueprint $table) {
            $table->dropColumn('chiffre_affaires');
        });
    }
};
