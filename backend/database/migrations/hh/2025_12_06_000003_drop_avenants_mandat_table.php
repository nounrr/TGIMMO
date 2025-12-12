<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('avenants_mandat')) {
            Schema::drop('avenants_mandat');
        }
    }

    public function down(): void
    {
        // Optional: recreate minimal table if rollback is needed
        Schema::create('avenants_mandat', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mandat_id');
            $table->string('reference')->nullable();
            $table->date('date_pouvoir_initial')->nullable();
            $table->string('objet_resume')->nullable();
            $table->text('modifs_text')->nullable();
            $table->decimal('nouveau_taux_gestion', 5, 2)->nullable();
            $table->date('date_effet')->nullable();
            $table->string('lieu_signature')->nullable();
            $table->date('date_signature')->nullable();
            $table->unsignedBigInteger('rep_b_user_id')->nullable();
            $table->enum('statut', ['brouillon', 'en_validation', 'signe', 'annule'])->default('brouillon');
            $table->string('fichier_url')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
        });
    }
};
