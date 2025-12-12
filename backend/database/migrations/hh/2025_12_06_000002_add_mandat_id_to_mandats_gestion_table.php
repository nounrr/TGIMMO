<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('mandats_gestion', function (Blueprint $table) {
            if (!Schema::hasColumn('mandats_gestion', 'mandat_id')) {
                $table->string('mandat_id', 80)->nullable()->unique()->after('reference');
            }
        });
    }

    public function down(): void
    {
        Schema::table('mandats_gestion', function (Blueprint $table) {
            if (Schema::hasColumn('mandats_gestion', 'mandat_id')) {
                $table->dropUnique(['mandat_id']);
                $table->dropColumn('mandat_id');
            }
        });
    }
};
