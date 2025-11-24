<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('imputation_charges')) {
            Schema::rename('imputation_charges','imputation_charges_old');
        }

        Schema::create('imputation_charges', function (Blueprint $table) {
            $table->id();
            $table->string('impute_a',40)->nullable()->index(); // bail, locataire, proprietaire, unite, intervention, charge_libre
            $table->unsignedBigInteger('id_impute')->nullable()->index();
            $table->string('titre')->nullable();
            $table->text('notes')->nullable();
            $table->string('charge_to',40)->default('proprietaire');
            $table->decimal('montant',12,2)->default(0);
            $table->timestamps();
            $table->index(['impute_a','id_impute','charge_to']);
        });

        if (Schema::hasTable('imputation_charges_old')) {
            // salvage data
            $rows = DB::table('imputation_charges_old')->select(['id','impute_a','id_impute','notes','charge_to','montant'])->get();
            foreach ($rows as $r) {
                DB::table('imputation_charges')->insert([
                    'id' => $r->id,
                    'impute_a' => $r->impute_a,
                    'id_impute' => $r->id_impute,
                    'notes' => $r->notes,
                    'charge_to' => $r->charge_to ?? 'proprietaire',
                    'montant' => $r->montant ?? 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('imputation_charges')) {
            Schema::drop('imputation_charges');
        }
        if (Schema::hasTable('imputation_charges_old')) {
            Schema::rename('imputation_charges_old','imputation_charges');
        }
    }
};
