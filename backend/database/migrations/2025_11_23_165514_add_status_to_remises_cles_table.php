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
        Schema::table('remises_cles', function (Blueprint $table) {
            $table->string('statut')->nullable()->default('effectue');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('remises_cles', function (Blueprint $table) {
            $table->dropColumn('statut');
        });
    }
};
