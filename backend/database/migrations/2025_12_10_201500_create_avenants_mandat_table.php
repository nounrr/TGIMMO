<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('avenants_mandat')) {
            Schema::create('avenants_mandat', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mandat_id')->constrained('mandats_gestion')->cascadeOnUpdate()->restrictOnDelete();
                $table->string('reference', 80)->nullable()->unique();
                $table->date('date_pouvoir_initial')->nullable();
                $table->string('objet_resume', 255)->nullable();
                $table->text('modifs_text')->nullable();
                $table->decimal('nouveau_taux_gestion', 8, 2)->nullable();
                $table->date('date_effet');
                $table->string('lieu_signature', 120)->nullable();
                $table->date('date_signature')->nullable();
                $table->foreignId('rep_b_user_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
                $table->enum('statut', ['brouillon','en_validation','signe','actif','resilie','annule','modifier'])->nullable();
                $table->string('fichier_url')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('avenants_mandat');
    }
};
