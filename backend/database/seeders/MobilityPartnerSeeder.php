<?php

namespace Database\Seeders;

use App\Models\MobilityPartner;
use Illuminate\Database\Seeder;

class MobilityPartnerSeeder extends Seeder
{
    public function run(): void
    {
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
        ];

        foreach ($partners as $partner) {
            MobilityPartner::updateOrCreate(
                ['name' => $partner['name']],
                $partner
            );
        }
    }
}
