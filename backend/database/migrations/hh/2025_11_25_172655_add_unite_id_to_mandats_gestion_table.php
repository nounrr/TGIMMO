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
        Schema::table('mandats_gestion', function (Blueprint $table) {
            $table->foreignId('unite_id')->nullable()->after('id')->constrained('unites')->onDelete('cascade');
            $table->unsignedBigInteger('proprietaire_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mandats_gestion', function (Blueprint $table) {
            $table->dropForeign(['unite_id']);
            $table->dropColumn('unite_id');
            $table->unsignedBigInteger('proprietaire_id')->nullable(false)->change();
        });
    }
};
