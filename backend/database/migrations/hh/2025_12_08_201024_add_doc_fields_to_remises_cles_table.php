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
        Schema::table('remises_cles', function (Blueprint $table) {
            $table->longText('doc_content')->nullable();
            $table->json('doc_variables')->nullable();
            $table->string('doc_template_key')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('remises_cles', function (Blueprint $table) {
            $table->dropColumn(['doc_content', 'doc_variables', 'doc_template_key']);
        });
    }
};
