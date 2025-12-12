<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Extend enum values to align with mandat statuses and versioning needs
        DB::statement("ALTER TABLE avenants_mandat MODIFY COLUMN statut ENUM('brouillon','en_validation','signe','actif','resilie','annule','modifier') DEFAULT 'brouillon'");
    }

    public function down(): void
    {
        // Revert to original enum (values outside original set may cause issues if present)
        DB::statement("ALTER TABLE avenants_mandat MODIFY COLUMN statut ENUM('brouillon','signe','actif','annule') DEFAULT 'brouillon'");
    }
};
