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
        Schema::create('avenants_mandat', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mandat_id');
            $table->string('reference', 80)->unique()->nullable();
            $table->date('date_pouvoir_initial')->nullable();
            $table->string('objet_resume', 255)->nullable();
            $table->text('modifs_text')->nullable();
            $table->date('date_effet');
            $table->string('lieu_signature', 120)->nullable();
            $table->date('date_signature')->nullable();
            $table->unsignedBigInteger('rep_b_user_id');
            $table->enum('statut', ['brouillon', 'signe', 'actif', 'annule'])->default('brouillon');
            $table->string('fichier_url', 255)->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();

            $table->foreign('mandat_id')->references('id')->on('mandats_gestion');
            $table->foreign('rep_b_user_id')->references('id')->on('users');
            $table->foreign('created_by')->references('id')->on('users');

            $table->index(['mandat_id'], 'idx_av_mandat');
            $table->index(['statut'], 'idx_av_statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('avenants_mandat');
    }
};
