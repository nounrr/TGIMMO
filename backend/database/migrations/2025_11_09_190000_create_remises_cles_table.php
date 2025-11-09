<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('remises_cles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bail_id')->constrained('baux')->cascadeOnDelete();
            $table->dateTime('date_remise');
            $table->json('cles'); // structure: { porte_principale: { checked: bool, nombre: int }, boite_lettres: {...}, portail_garage: {...}, autres: [{ label, nombre }] }
            $table->text('remarques')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('remises_cles');
    }
};
