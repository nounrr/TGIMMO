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
            $table->dropForeign(['unite_id']); // Drop foreign key first if it exists
            $table->dropColumn('unite_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mandats_gestion', function (Blueprint $table) {
            $table->foreignId('unite_id')->nullable()->constrained('unites')->onDelete('cascade');
        });
    }
};
