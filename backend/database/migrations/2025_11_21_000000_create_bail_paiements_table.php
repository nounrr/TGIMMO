<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bail_paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bail_id')->constrained('baux')->cascadeOnDelete();
            $table->unsignedTinyInteger('period_month'); // 1-12
            $table->unsignedSmallInteger('period_year');
            $table->date('due_date')->nullable();
            $table->decimal('amount_due', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->nullable();
            $table->string('status')->default('pending'); // pending, paid, partial, overdue, cancelled
            $table->timestamp('paid_at')->nullable();
            $table->string('method')->nullable();
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['bail_id','period_month','period_year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bail_paiements');
    }
};