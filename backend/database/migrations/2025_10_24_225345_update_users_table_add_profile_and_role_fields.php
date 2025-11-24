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
        Schema::table('users', function (Blueprint $table) {
            $table->string('fonction')->nullable()->after('name');
            $table->string('service')->nullable()->after('fonction');
            $table->string('telephone_interne')->nullable()->after('service');
            $table->string('statut')->default('actif')->after('telephone_interne');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['fonction', 'service', 'telephone_interne', 'statut']);
        });
    }
};
