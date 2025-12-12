<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('unites_proprietaires', function (Blueprint $table) {
            // Add unite_id if it doesn't exist
            if (!Schema::hasColumn('unites_proprietaires', 'unite_id')) {
                $table->foreignId('unite_id')->nullable()->after('id')->constrained('unites')->onDelete('cascade');
            }
            
            // Add dates if they don't exist
            if (!Schema::hasColumn('unites_proprietaires', 'date_debut')) {
                $table->date('date_debut')->nullable()->after('pourcentage');
            }
            if (!Schema::hasColumn('unites_proprietaires', 'date_fin')) {
                $table->date('date_fin')->nullable()->after('date_debut');
            }
        });

        // Make mandat_id nullable
        Schema::table('unites_proprietaires', function (Blueprint $table) {
            $table->unsignedBigInteger('mandat_id')->nullable()->change();
        });

        // Populate unite_id from mandats for existing records
        $results = DB::table('unites_proprietaires')
            ->join('mandats_gestion', 'unites_proprietaires.mandat_id', '=', 'mandats_gestion.id')
            ->select('unites_proprietaires.id', 'mandats_gestion.unite_id')
            ->get();

        foreach ($results as $row) {
            DB::table('unites_proprietaires')
                ->where('id', $row->id)
                ->update(['unite_id' => $row->unite_id]);
        }
    }

    public function down(): void
    {
        Schema::table('unites_proprietaires', function (Blueprint $table) {
            // We can't easily revert nullable mandat_id without data loss risk or strict checks
            // But we can drop the columns we added
            $table->dropForeign(['unite_id']);
            $table->dropColumn(['unite_id', 'date_debut', 'date_fin']);
        });
    }
};
