<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approche_proprietaires', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proprietaire_id');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('proprietaire_id')->references('id')->on('proprietaires')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approche_proprietaires');
    }
};