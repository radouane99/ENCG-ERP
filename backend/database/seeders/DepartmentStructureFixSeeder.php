<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Filiere;
use App\Models\Professor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DepartmentStructureFixSeeder extends Seeder
{
    public function run(): void
    {
        $institutionId = 1;
        $password = Hash::make('Password@123');

        // 1. Ensure the 5 official ENCG Departments exist with Arabic names and codes
        $deptsData = [
            'SG' => ['name' => 'Sciences de Gestion', 'name_ar' => 'شعبة علوم التدبير', 'head' => 'Pr. Abdelhak El Amrani'],
            'EA' => ['name' => 'Économie Appliquée', 'name_ar' => 'شعبة الاقتصاد التطبيقي', 'head' => 'Pr. Mohamed Benjelloun'],
            'DA' => ['name' => 'Droit des Affaires', 'name_ar' => 'شعبة قانون الأعمال', 'head' => 'Pr. Fatima Zahra Alami'],
            'LC' => ['name' => 'Langues et Communication', 'name_ar' => 'شعبة اللغات والتواصل', 'head' => 'Pr. Karim Idrissi'],
            'IG' => ['name' => 'Informatique de Gestion', 'name_ar' => 'شعبة الإعلاميات والأنظمة', 'head' => 'Pr. Nadia Tazi'],
        ];

        $deptModels = [];
        foreach ($deptsData as $code => $data) {
            $dept = Department::updateOrCreate(
                ['code' => $code],
                [
                    'institution_id' => $institutionId,
                    'name' => $data['name'],
                    'name_ar' => $data['name_ar'],
                    'head_name' => $data['head'],
                    'is_active' => true,
                ]
            );
            $deptModels[$code] = $dept;
        }

        // 2. Ensure Professors exist and are assigned to each Department
        $professorsRoster = [
            ['first' => 'Abdelhak', 'last' => 'El Amrani', 'email' => 'a.elamrani@encg-fes.ac.ma', 'dept' => 'SG', 'spec' => 'Finance & Contrôle de Gestion'],
            ['first' => 'Sara', 'last' => 'Benmoussa', 'email' => 's.benmoussa@encg-fes.ac.ma', 'dept' => 'SG', 'spec' => 'Marketing & Stratégie'],
            ['first' => 'Youssef', 'last' => 'Chraibi', 'email' => 'y.chraibi@encg-fes.ac.ma', 'dept' => 'SG', 'spec' => 'Comptabilité Approfondie'],
            ['first' => 'Mohamed', 'last' => 'Benjelloun', 'email' => 'm.benjelloun@encg-fes.ac.ma', 'dept' => 'EA', 'spec' => 'Économétrie & Macroéconomie'],
            ['first' => 'Amina', 'last' => 'Tazi', 'email' => 'a.tazi@encg-fes.ac.ma', 'dept' => 'EA', 'spec' => 'Commerce International'],
            ['first' => 'Fatima Zahra', 'last' => 'Alami', 'email' => 'fz.alami@encg-fes.ac.ma', 'dept' => 'DA', 'spec' => 'Droit des Affaires & Fiscalité'],
            ['first' => 'Hassan', 'last' => 'Filali', 'email' => 'h.filali@encg-fes.ac.ma', 'dept' => 'DA', 'spec' => 'Droit Commercial'],
            ['first' => 'Karim', 'last' => 'Idrissi', 'email' => 'k.idrissi@encg-fes.ac.ma', 'dept' => 'LC', 'spec' => 'Communication d\'Entreprise & TEC'],
            ['first' => 'Layla', 'last' => 'Berrada', 'email' => 'l.berrada@encg-fes.ac.ma', 'dept' => 'LC', 'spec' => 'Business English'],
            ['first' => 'Nadia', 'last' => 'Tazi', 'email' => 'n.tazi@encg-fes.ac.ma', 'dept' => 'IG', 'spec' => 'Systèmes d\'Information & ERP'],
            ['first' => 'Rachid', 'last' => 'Mansouri', 'email' => 'r.mansouri@encg-fes.ac.ma', 'dept' => 'IG', 'spec' => 'Data Analytics & Informatique'],
        ];

        foreach ($professorsRoster as $p) {
            $user = User::updateOrCreate(
                ['email' => $p['email']],
                [
                    'institution_id' => $institutionId,
                    'name' => "{$p['first']} {$p['last']}",
                    'first_name' => $p['first'],
                    'last_name' => $p['last'],
                    'password' => $password,
                    'is_active' => true,
                ]
            );
            $user->assignRole('professor');

            Professor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'institution_id' => $institutionId,
                    'department_id' => $deptModels[$p['dept']]->id,
                    'specialty' => $p['spec'],
                    'grade' => 'PES',
                    'contract_type' => 'permanent',
                    'is_active' => true,
                ]
            );
        }

        // 3. Ensure Filieres are distributed across Departments
        $filieresRoster = [
            ['code' => 'TC', 'name' => 'Tronc Commun ENCG', 'dept' => 'SG', 'duration' => 2],
            ['code' => 'GFC', 'name' => 'Gestion Financière et Comptable', 'dept' => 'SG', 'duration' => 3],
            ['code' => 'MCM', 'name' => 'Management Commercial et Marketing', 'dept' => 'SG', 'duration' => 3],
            ['code' => 'CI', 'name' => 'Commerce International & Logistique', 'dept' => 'EA', 'duration' => 3],
            ['code' => 'ACDA', 'name' => 'Audit & Conseil Juridique des Affaires', 'dept' => 'DA', 'duration' => 3],
            ['code' => 'MSI', 'name' => 'Management des Systèmes d\'Information', 'dept' => 'IG', 'duration' => 3],
        ];

        foreach ($filieresRoster as $f) {
            Filiere::updateOrCreate(
                ['code' => $f['code']],
                [
                    'institution_id' => $institutionId,
                    'department_id' => $deptModels[$f['dept']]->id,
                    'name' => $f['name'],
                    'type' => 'grande_ecole',
                    'duration_years' => $f['duration'],
                    'is_active' => true,
                ]
            );
        }
    }
}
