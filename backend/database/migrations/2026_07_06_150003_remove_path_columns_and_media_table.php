<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Standard Spatie MediaLibrary Media Table
        if (!Schema::hasTable('media')) {
            Schema::create('media', function (Blueprint $table) {
                $table->id();
                $table->morphs('model');
                $table->uuid('uuid')->nullable()->unique();
                $table->string('collection_name');
                $table->string('name');
                $table->string('file_name');
                $table->string('mime_type')->nullable();
                $table->string('disk');
                $table->string('conversions_disk')->nullable();
                $table->unsignedBigInteger('size');
                $table->json('manipulations');
                $table->json('custom_properties');
                $table->json('generated_conversions');
                $table->json('responsive_images');
                $table->unsignedInteger('order_column')->nullable()->index();
                $table->timestamps();
            });
        }

        // Drop path columns
        $tables = [
            'users' => ['avatar_path', 'photo_path'],
            'absence_justifications' => ['document_path'],
            'clubs' => ['logo_path'],
            'club_events' => ['poster_path'],
            'deliberations' => ['pv_file_path'],
            'generated_documents' => ['file_path', 'qr_code_path'],
            'institutions' => ['logo_path', 'stamp_path', 'signature_path'],
            'internship_documents' => ['file_path'],
            'learning_materials' => ['file_path'],
            'vacation_contracts' => ['contract_file_path'],
            'vacation_payments' => ['export_file_path'],
        ];

        foreach ($tables as $tableName => $columns) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName, $columns) {
                    foreach ($columns as $column) {
                        if (Schema::hasColumn($tableName, $column)) {
                            $table->dropColumn($column);
                        }
                    }
                });
            }
        }
    }

    public function down(): void
    {
        // Reverse operations
    }
};
