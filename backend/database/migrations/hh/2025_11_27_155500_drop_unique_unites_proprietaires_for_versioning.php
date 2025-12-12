<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Drop unique constraint to allow multiple versioned rows (actif + modifier) for same (unite_id, proprietaire_id, date_debut)
        // MySQL requires explicit DROP INDEX by name
        DB::statement('ALTER TABLE `unites_proprietaires` DROP INDEX `uq_unites_proprietaires`');
        // Add non-unique composite index to preserve query performance
        DB::statement('ALTER TABLE `unites_proprietaires` ADD INDEX `idx_unites_prop_versioning` (`unite_id`,`proprietaire_id`,`date_debut`)');
    }

    public function down(): void
    {
        // Recreate original unique index (may fail if duplicates exist)
        DB::statement('ALTER TABLE `unites_proprietaires` DROP INDEX `idx_unites_prop_versioning`');
        DB::statement('ALTER TABLE `unites_proprietaires` ADD UNIQUE `uq_unites_proprietaires` (`unite_id`,`proprietaire_id`,`date_debut`)');
    }
};
