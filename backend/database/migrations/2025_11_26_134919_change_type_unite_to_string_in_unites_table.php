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
            // Using raw SQL to avoid doctrine/dbal dependency
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE unites MODIFY COLUMN type_unite VARCHAR(100) NOT NULL");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            // Revert to enum is risky if data doesn't match, but here is the attempt
            // \Illuminate\Support\Facades\DB::statement("ALTER TABLE unites MODIFY COLUMN type_unite ENUM('appartement','bureau','local_commercial','garage','autre') NOT NULL");
        });
    }
};
