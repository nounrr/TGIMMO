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
        // Locataires
        Schema::table('locataires', function (Blueprint $table) {
            // Add temporary column
            $table->json('telephone_json')->nullable()->after('telephone');
        });

        // Migrate data for locataires
        \DB::table('locataires')->get()->each(function ($item) {
            $phones = [];
            if (!empty($item->telephone)) {
                $phones[] = $item->telephone;
            }
            \DB::table('locataires')
                ->where('id', $item->id)
                ->update(['telephone_json' => json_encode($phones)]);
        });

        Schema::table('locataires', function (Blueprint $table) {
            $table->dropColumn('telephone');
        });
        
        Schema::table('locataires', function (Blueprint $table) {
            $table->renameColumn('telephone_json', 'telephone');
        });

        // Proprietaires
        Schema::table('proprietaires', function (Blueprint $table) {
            $table->json('telephone_json')->nullable()->after('telephone');
        });

        // Migrate data for proprietaires
        \DB::table('proprietaires')->get()->each(function ($item) {
            $phones = [];
            if (!empty($item->telephone)) {
                $phones[] = $item->telephone;
            }
            \DB::table('proprietaires')
                ->where('id', $item->id)
                ->update(['telephone_json' => json_encode($phones)]);
        });

        Schema::table('proprietaires', function (Blueprint $table) {
            $table->dropColumn('telephone');
        });

        Schema::table('proprietaires', function (Blueprint $table) {
            $table->renameColumn('telephone_json', 'telephone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert Locataires
        Schema::table('locataires', function (Blueprint $table) {
            $table->string('telephone_string', 20)->nullable()->after('telephone');
        });

        \DB::table('locataires')->get()->each(function ($item) {
            $phones = json_decode($item->telephone, true);
            $firstPhone = is_array($phones) && count($phones) > 0 ? $phones[0] : null;
            \DB::table('locataires')
                ->where('id', $item->id)
                ->update(['telephone_string' => $firstPhone]);
        });

        Schema::table('locataires', function (Blueprint $table) {
            $table->dropColumn('telephone');
        });

        Schema::table('locataires', function (Blueprint $table) {
            $table->renameColumn('telephone_string', 'telephone');
        });

        // Revert Proprietaires
        Schema::table('proprietaires', function (Blueprint $table) {
            $table->string('telephone_string', 20)->nullable()->after('telephone');
        });

        \DB::table('proprietaires')->get()->each(function ($item) {
            $phones = json_decode($item->telephone, true);
            $firstPhone = is_array($phones) && count($phones) > 0 ? $phones[0] : null;
            \DB::table('proprietaires')
                ->where('id', $item->id)
                ->update(['telephone_string' => $firstPhone]);
        });

        Schema::table('proprietaires', function (Blueprint $table) {
            $table->dropColumn('telephone');
        });

        Schema::table('proprietaires', function (Blueprint $table) {
            $table->renameColumn('telephone_string', 'telephone');
        });
    }
};
