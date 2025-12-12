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
        Schema::table('bail_paiements', function (Blueprint $table) {
            if (!Schema::hasColumn('bail_paiements', 'due_date')) {
                $table->date('due_date')->nullable()->after('period_year');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bail_paiements', function (Blueprint $table) {
            if (Schema::hasColumn('bail_paiements', 'due_date')) {
                $table->dropColumn('due_date');
            }
        });
    }
};
