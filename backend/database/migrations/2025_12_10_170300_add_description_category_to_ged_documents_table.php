<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ged_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('ged_documents', 'description')) {
                $table->text('description')->nullable()->after('uploaded_by');
            }
            if (!Schema::hasColumn('ged_documents', 'category')) {
                $table->string('category', 100)->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ged_documents', function (Blueprint $table) {
            if (Schema::hasColumn('ged_documents', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('ged_documents', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
