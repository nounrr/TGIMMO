<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approche_locataires', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('locataire_id');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('locataire_id')->references('id')->on('locataires')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approche_locataires');
    }
};