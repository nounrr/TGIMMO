<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->dropForeign(['locataire_id']);
            $table->dropColumn('locataire_id');
            $table->dropForeign(['proprietaire_id']);
            $table->dropColumn('proprietaire_id');
        });
    }

    public function down()
    {
        Schema::table('interventions', function (Blueprint $table) {
            $table->foreignId('locataire_id')->nullable()->constrained('locataires')->nullOnDelete();
            $table->foreignId('proprietaire_id')->nullable()->constrained('proprietaires')->nullOnDelete();
        });
    }
};
