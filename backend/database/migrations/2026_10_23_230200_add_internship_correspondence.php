<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create('internship_messages', function (Blueprint $t) { $t->id(); $t->foreignId('internship_id')->constrained()->restrictOnDelete(); $t->foreignId('user_id')->constrained()->restrictOnDelete(); $t->text('body'); $t->timestamps(); $t->index(['internship_id', 'id']); }); }
    public function down(): void { throw new RuntimeException('Preserve internship correspondence using a verified backup.'); }
};