<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            if (!Schema::hasColumn('unites', 'titre_foncier')) {
                $table->string('titre_foncier')->nullable()->after('adresse_complete');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            if (Schema::hasColumn('unites', 'titre_foncier')) {
                $table->dropColumn('titre_foncier');
            }
        });
    }
};
