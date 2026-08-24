<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * DSAR uses the existing data_export_requests table (Law 09-08 Art. 7).
     */
    public function up(): void
    {
        // Intentionally empty: privacy_dsar_requests duplicated data_export_requests.
    }

    public function down(): void
    {
        //
    }
};
