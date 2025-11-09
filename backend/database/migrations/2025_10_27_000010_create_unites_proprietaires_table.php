<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('unites_proprietaires', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('unite_id');
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedInteger('part_numerateur')->default(1);
            $table->unsignedInteger('part_denominateur')->default(1);
            $table->decimal('part_pourcent', 7, 4)->storedAs('((part_numerateur / part_denominateur) * 100)');
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamps();

            $table->unique(['unite_id', 'proprietaire_id', 'date_debut'], 'uq_unites_proprietaires');
            $table->index(['unite_id', 'date_debut']);

            $table->foreign('unite_id')
                ->references('id')
                ->on('unites')
                ->onDelete('cascade');
            $table->foreign('proprietaire_id')
                ->references('id')
                ->on('proprietaires')
                ->onDelete('cascade');

        });

        // Add CHECK constraint via raw SQL for MySQL/SQLite compatibility across Laravel versions
        $driver = DB::getDriverName();
        if (in_array($driver, ['mysql', 'sqlite'])) {
            try {
                DB::statement("ALTER TABLE `unites_proprietaires` ADD CONSTRAINT `chk_unites_proprietaires_parts` CHECK (part_numerateur > 0 AND part_denominateur >= part_numerateur)");
            } catch (\Throwable $e) {
                // If DB doesn't support CHECK or it already exists, ignore silently
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('unites_proprietaires');
    }
};
