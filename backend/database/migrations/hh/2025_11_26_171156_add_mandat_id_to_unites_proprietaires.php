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
        Schema::table('unites_proprietaires', function (Blueprint $table) {
            $table->unsignedBigInteger('mandat_id')->nullable()->after('unite_id');
            $table->foreign('mandat_id')->references('id')->on('mandats_gestion')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites_proprietaires', function (Blueprint $table) {
            $table->dropForeign(['mandat_id']);
            $table->dropColumn('mandat_id');
        });
    }
};
