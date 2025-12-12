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
        Schema::table('unites', function (Blueprint $table) {
            $table->dropColumn('usage_bien');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            $table->string('usage_bien')->nullable();
        });
    }
};
