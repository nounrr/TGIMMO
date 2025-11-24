<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->string('impute_a', 40)->nullable()->after('locataire_id');
            $table->unsignedBigInteger('id_impute')->nullable()->after('impute_a');
            $table->string('titre')->nullable()->after('notes');
            $table->string('sous_titre')->nullable()->after('titre');
            $table->index(['impute_a','id_impute']);
        });

        // Backfill impute_a and id_impute based on existing foreign keys.
        DB::table('imputation_charges')->orderBy('id')->chunk(500, function ($rows) {
            foreach ($rows as $row) {
                $imputeA = null; $idImpute = null;
                if (!is_null($row->bail_id)) { $imputeA = 'bail'; $idImpute = $row->bail_id; }
                elseif (!is_null($row->locataire_id)) { $imputeA = 'locataire'; $idImpute = $row->locataire_id; }
                elseif (!is_null($row->proprietaire_id)) { $imputeA = 'proprietaire'; $idImpute = $row->proprietaire_id; }
                elseif (!is_null($row->unite_id)) { $imputeA = 'unite'; $idImpute = $row->unite_id; }
                elseif (!is_null($row->intervention_id)) { $imputeA = 'intervention'; $idImpute = $row->intervention_id; }
                else { $imputeA = 'charge_libre'; }
                DB::table('imputation_charges')->where('id', $row->id)->update([
                    'impute_a' => $imputeA,
                    'id_impute' => $idImpute,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('imputation_charges', function (Blueprint $table) {
            $table->dropIndex(['impute_a','id_impute']);
            $table->dropColumn(['impute_a','id_impute','titre','sous_titre']);
        });
    }
};
