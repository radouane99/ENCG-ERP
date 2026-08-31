<?php

use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Group;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $institution = Institution::first();
        if (! $institution) {
            return;
        }

        $gfcFiliere = Filiere::where('code', 'GFC')->first();
        $mcmFiliere = Filiere::where('code', 'MCM')->first();

        // 1. Seed GFC-S6 Modules (Finance & Contrôle de Gestion - Semestre 6 Printemps)
        if ($gfcFiliere) {
            $gfcS6Modules = [
                ['name' => 'Audit & Contrôle de Gestion', 'code' => 'GFC-S6-M01', 'semester' => 6, 'coeff' => 3],
                ['name' => 'Marchés des Capitaux & Instruments Financiers', 'code' => 'GFC-S6-M02', 'semester' => 6, 'coeff' => 3],
                ['name' => 'Comptabilité Internationale & Normes IFRS', 'code' => 'GFC-S6-M03', 'semester' => 6, 'coeff' => 3],
                ['name' => 'Droit Fiscal & Contentieux des Affaires', 'code' => 'GFC-S6-M04', 'semester' => 6, 'coeff' => 2],
                ['name' => 'Systèmes d\'Information Comptables (ERP Finance)', 'code' => 'GFC-S6-M05', 'semester' => 6, 'coeff' => 2],
                ['name' => 'Économétrie Appliquée à la Finance', 'code' => 'GFC-S6-M06', 'semester' => 6, 'coeff' => 2],
                ['name' => 'Anglais Financier & Communication Professionnelle', 'code' => 'GFC-S6-M07', 'semester' => 6, 'coeff' => 1],
            ];

            foreach ($gfcS6Modules as $m) {
                Module::firstOrCreate(
                    ['code' => $m['code']],
                    [
                        'institution_id' => $institution->id,
                        'filiere_id' => $gfcFiliere->id,
                        'name' => $m['name'],
                        'semester_number' => $m['semester'],
                        'coefficient' => $m['coeff'],
                        'hours_cm' => 36,
                        'hours_td' => 12,
                        'hours_tp' => 0,
                        'is_active' => true,
                    ]
                );
            }
        }

        // 2. Seed MCM-S6 Modules (Marketing & Commerce - Semestre 6 Printemps)
        if ($mcmFiliere) {
            $mcmS6Modules = [
                ['name' => 'Marketing Digital & E-Commerce', 'code' => 'MCM-S6-M01', 'semester' => 6, 'coeff' => 3],
                ['name' => 'Gestion de la Relation Client (CRM)', 'code' => 'MCM-S6-M02', 'semester' => 6, 'coeff' => 3],
                ['name' => 'Négociation & Stratégie Commerciale', 'code' => 'MCM-S6-M03', 'semester' => 6, 'coeff' => 3],
                ['name' => 'Droit de la Consommation & de la Concurrence', 'code' => 'MCM-S6-M04', 'semester' => 6, 'coeff' => 2],
                ['name' => 'Data Analytics & Business Intelligence Marketing', 'code' => 'MCM-S6-M05', 'semester' => 6, 'coeff' => 2],
                ['name' => 'Économie Internationale & Commerce Extérieur', 'code' => 'MCM-S6-M06', 'semester' => 6, 'coeff' => 2],
                ['name' => 'Communication & Négociation en Anglais', 'code' => 'MCM-S6-M07', 'semester' => 6, 'coeff' => 1],
            ];

            foreach ($mcmS6Modules as $m) {
                Module::firstOrCreate(
                    ['code' => $m['code']],
                    [
                        'institution_id' => $institution->id,
                        'filiere_id' => $mcmFiliere->id,
                        'name' => $m['name'],
                        'semester_number' => $m['semester'],
                        'coefficient' => $m['coeff'],
                        'hours_cm' => 36,
                        'hours_td' => 12,
                        'hours_tp' => 0,
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Module::whereIn('code', [
            'GFC-S6-M01', 'GFC-S6-M02', 'GFC-S6-M03', 'GFC-S6-M04', 'GFC-S6-M05', 'GFC-S6-M06', 'GFC-S6-M07',
            'MCM-S6-M01', 'MCM-S6-M02', 'MCM-S6-M03', 'MCM-S6-M04', 'MCM-S6-M05', 'MCM-S6-M06', 'MCM-S6-M07',
        ])->delete();
    }
};
