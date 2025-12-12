<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create the pivot table
        Schema::create('ged_documentables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ged_document_id')->constrained('ged_documents')->cascadeOnDelete();
            $table->morphs('documentable');
            $table->timestamps();
        });

        // 2. Migrate existing data (if any)
        $documents = DB::table('ged_documents')->whereNotNull('documentable_id')->get();
        foreach ($documents as $doc) {
            DB::table('ged_documentables')->insert([
                'ged_document_id' => $doc->id,
                'documentable_id' => $doc->documentable_id,
                'documentable_type' => $doc->documentable_type,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Drop the old columns
        Schema::table('ged_documents', function (Blueprint $table) {
            $table->dropMorphs('documentable');
        });
    }

    public function down(): void
    {
        Schema::table('ged_documents', function (Blueprint $table) {
            $table->nullableMorphs('documentable');
        });

        // Restore data (best effort, only first relationship)
        $relations = DB::table('ged_documentables')->get();
        foreach ($relations as $rel) {
            DB::table('ged_documents')
                ->where('id', $rel->ged_document_id)
                ->update([
                    'documentable_id' => $rel->documentable_id,
                    'documentable_type' => $rel->documentable_type,
                ]);
        }

        Schema::dropIfExists('ged_documentables');
    }
};
