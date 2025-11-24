<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Update default status and normalize existing rows
        Schema::table('bail_paiements', function (Blueprint $table) {
            $table->string('status')->default('en_validation')->change();
        });
        DB::table('bail_paiements')->where('status', 'pending')->update(['status' => 'en_validation']);
        DB::table('bail_paiements')->whereIn('status', ['partial','overdue','cancelled','paid'])->update(['status' => 'valide']);
    }

    public function down(): void
    {
        Schema::table('bail_paiements', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
        DB::table('bail_paiements')->where('status', 'en_validation')->update(['status' => 'pending']);
        // Rows that were 'valide' remain paid conceptually; we won't revert those to previous complex statuses.
    }
};