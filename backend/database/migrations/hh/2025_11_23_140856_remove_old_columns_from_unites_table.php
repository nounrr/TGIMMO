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
        // Utiliser des requêtes SQL brutes pour supprimer les colonnes
        $columnsToCheck = [
            'latitude',
            'longitude',
            'bail_actuel_id',
            'locataire_actuel_id',
            'date_entree_actuelle'
        ];
        
        foreach ($columnsToCheck as $column) {
            if (Schema::hasColumn('unites', $column)) {
                try {
                    Schema::table('unites', function (Blueprint $table) use ($column) {
                        $table->dropColumn($column);
                    });
                } catch (\Exception $e) {
                    // Ignorer les erreurs si la colonne ne peut pas être supprimée
                    echo "Could not drop column {$column}: " . $e->getMessage() . "\n";
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('unites', function (Blueprint $table) {
            // Remettre les colonnes supprimées
            if (!Schema::hasColumn('unites', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable();
            }
            if (!Schema::hasColumn('unites', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable();
            }
            if (!Schema::hasColumn('unites', 'bail_actuel_id')) {
                $table->unsignedBigInteger('bail_actuel_id')->nullable();
            }
            if (!Schema::hasColumn('unites', 'locataire_actuel_id')) {
                $table->unsignedBigInteger('locataire_actuel_id')->nullable();
            }
            if (!Schema::hasColumn('unites', 'date_entree_actuelle')) {
                $table->date('date_entree_actuelle')->nullable();
            }
        });
    }
};
