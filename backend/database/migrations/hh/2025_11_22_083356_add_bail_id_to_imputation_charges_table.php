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
        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->foreignId('bail_id')->nullable()->constrained('baux')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->dropForeign(['bail_id']);
            $table->dropColumn('bail_id');
        });
    }
};
