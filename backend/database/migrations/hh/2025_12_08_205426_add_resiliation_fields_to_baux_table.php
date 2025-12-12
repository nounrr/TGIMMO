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
        Schema::table('baux', function (Blueprint $table) {
            $table->date('date_resiliation')->nullable()->after('statut');
            $table->longText('resiliation_doc_content')->nullable()->after('date_resiliation');
            $table->json('resiliation_doc_variables')->nullable()->after('resiliation_doc_content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('baux', function (Blueprint $table) {
            $table->dropColumn(['date_resiliation', 'resiliation_doc_content', 'resiliation_doc_variables']);
        });
    }
};
