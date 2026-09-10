<?php

namespace Database\Seeders;

use App\Models\MobilityPartner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MobilityPartnerSeeder extends Seeder
{
    public function run(): void
    {
        // Delete FK dependencies first before truncating
        DB::table('student_mobility_choices')->delete();
        DB::table('mobility_partners')->truncate();

        $partners = [
            [
                'name' => 'KEDGE Business School',
                'country' => 'France',
                'city' => 'Bordeaux',
                'program_type' => 'Double Diplôme',
                'slots' => 5,
                'gpa_required' => 14.00,
                'is_active' => true,
            ],
            [
                'name' => 'NEOMA Business School',
                'country' => 'France',
                'city' => 'Rouen',
                'program_type' => 'Semestre d\'Échange',
                'slots' => 8,
                'gpa_required' => 13.50,
                'is_active' => true,
            ],
            [
                'name' => 'Université Laval',
                'country' => 'Canada',
                'city' => 'Québec',
                'program_type' => 'Semestre d\'Échange',
                'slots' => 3,
                'gpa_required' => 14.50,
                'is_active' => true,
            ],
            [
                'name' => 'Kyung Hee University',
                'country' => 'Corée du Sud',
                'city' => 'Séoul',
                'program_type' => 'Semestre d\'Échange',
                'slots' => 2,
                'gpa_required' => 13.00,
                'is_active' => true,
            ],
            [
                'name' => 'Tec de Monterrey',
                'country' => 'Mexique',
                'city' => 'Monterrey',
                'program_type' => "Semestre d'Échange",
                'slots' => 4,
                'gpa_required' => 14.00,
                'is_active' => true,
            ],
            [
                'name' => 'Politecnico di Milano',
                'country' => 'Italie',
                'city' => 'Milan',
                'program_type' => 'Double Diplôme',
                'slots' => 2,
                'gpa_required' => 15.00,
                'is_active' => true,
            ],
            [
                'name' => 'Hochschule München',
                'country' => 'Allemagne',
                'city' => 'Munich',
                'program_type' => "Semestre d'Échange",
                'slots' => 6,
                'gpa_required' => 13.00,
                'is_active' => true,
            ],
            [
                'name' => 'IAE Paris – Sorbonne',
                'country' => 'France',
                'city' => 'Paris',
                'program_type' => "Programme d'Échange",
                'slots' => 4,
                'gpa_required' => 13.50,
                'is_active' => true,
            ],
            [
                'name' => 'Université Catholique de Louvain',
                'country' => 'Belgique',
                'city' => 'Louvain-la-Neuve',
                'program_type' => "Programme d'Échange",
                'slots' => 3,
                'gpa_required' => 13.50,
                'is_active' => true,
            ],
            [
                'name' => 'ESIC Business & Marketing School',
                'country' => 'Espagne',
                'city' => 'Madrid',
                'program_type' => "Programme d'Échange",
                'slots' => 3,
                'gpa_required' => 12.50,
                'is_active' => true,
            ],
            [
                'name' => 'HEC Montréal',
                'country' => 'Canada',
                'city' => 'Montréal',
                'program_type' => 'Double Diplôme',
                'slots' => 2,
                'gpa_required' => 15.00,
                'is_active' => true,
            ],
            [
                'name' => 'Université Tunis El Manar – FSEG',
                'country' => 'Tunisie',
                'city' => 'Tunis',
                'program_type' => "Programme d'Échange",
                'slots' => 4,
                'gpa_required' => 12.00,
                'is_active' => true,
            ],
        ];

        foreach ($partners as $partner) {
            MobilityPartner::create($partner);
        }
    }
}
