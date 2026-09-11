<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class EnsureStudentFullCursusCommand extends Command
{
    protected $signature = 'encg:ensure-student-full-cursus';
    protected $description = 'Génère et archive l’historique académique complet (S1, S2, S3, S4 archivés + S5 en cours) pour les étudiants ENCG';

    public function handle(): int
    {
        $this->info('Démarrage de la configuration du cursus complet (S1 à S5)...');

        $tc = Filiere::where('code', 'TC')->first() ?? Filiere::find(1);
        if (! $tc) {
            $this->error('Filière Tronc Commun introuvable.');
            return 1;
        }

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        $instId = $academicYear?->institution_id ?? 1;

        // 1. Créer les modules officiels ENCG Tronc Commun pour S3 et S4 s'ils n'existent pas
        $s3ModulesData = [
            ['code' => 'TC-S3-M01', 'name' => 'Mathématiques Financières & R.O', 'name_ar' => 'الرياضيات المالية وبحوث العمليات', 'sem' => 3, 'coef' => 2.0],
            ['code' => 'TC-S3-M02', 'name' => 'Comptabilité Analytique de Gestion', 'name_ar' => 'المحاسبة التحليلية للتسيير', 'sem' => 3, 'coef' => 2.5],
            ['code' => 'TC-S3-M03', 'name' => 'Macroéconomie & Conjoncture', 'name_ar' => 'الاقتصاد الكلي والظرفية', 'sem' => 3, 'coef' => 2.0],
            ['code' => 'TC-S3-M04', 'name' => 'Droit des Affaires & Contrats', 'name_ar' => 'قانون الأعمال والعقود التجارية', 'sem' => 3, 'coef' => 1.5],
            ['code' => 'TC-S3-M05', 'name' => 'Gestion des Ressources Humaines', 'name_ar' => 'تدبير الموارد البشرية', 'sem' => 3, 'coef' => 2.0],
            ['code' => 'TC-S3-M06', 'name' => 'Systèmes d’Information & BDD', 'name_ar' => 'أنظمة المعلومات وقواعد البيانات', 'sem' => 3, 'coef' => 1.5],
            ['code' => 'TC-S3-M07', 'name' => 'Communication & Anglais des Affaires', 'name_ar' => 'التواصل والإنجليزية المهنية', 'sem' => 3, 'coef' => 1.5],
        ];

        $s4ModulesData = [
            ['code' => 'TC-S4-M01', 'name' => 'Analyse des Données Multivariées', 'name_ar' => 'تحليل المعطيات الإحصائية', 'sem' => 4, 'coef' => 2.0],
            ['code' => 'TC-S4-M02', 'name' => 'Comptabilité des Sociétés', 'name_ar' => 'محاسبة الشركات التجارية', 'sem' => 4, 'coef' => 2.5],
            ['code' => 'TC-S4-M03', 'name' => 'Économie Monétaire & Bancaire', 'name_ar' => 'الاقتصاد النقدي والمصرفي', 'sem' => 4, 'coef' => 2.0],
            ['code' => 'TC-S4-M04', 'name' => 'Fiscalité de l’Entreprise Marocaine', 'name_ar' => 'الجباية والضرائب المقاولاتية', 'sem' => 4, 'coef' => 2.0],
            ['code' => 'TC-S4-M05', 'name' => 'Gestion de Production & Logistique', 'name_ar' => 'تدبير الإنتاج واللوجستيك', 'sem' => 4, 'coef' => 2.0],
            ['code' => 'TC-S4-M06', 'name' => 'Droit du Travail & Sécurité Sociale', 'name_ar' => 'قانون الشغل والضمان الاجتماعي', 'sem' => 4, 'coef' => 1.5],
            ['code' => 'TC-S4-M07', 'name' => 'Méthodologie & Espagnol Professionnel', 'name_ar' => 'المنهجية والإسبانية المهنية', 'sem' => 4, 'coef' => 1.5],
        ];

        $createdModulesCount = 0;
        foreach (array_merge($s3ModulesData, $s4ModulesData) as $mData) {
            $mod = Module::where('code', $mData['code'])->first();
            if (! $mod) {
                Module::create([
                    'institution_id' => $instId,
                    'filiere_id' => $tc->id,
                    'name' => $mData['name'],
                    'name_ar' => $mData['name_ar'],
                    'code' => $mData['code'],
                    'semester_number' => $mData['sem'],
                    'coefficient' => $mData['coef'],
                    'credit_hours' => 36.0,
                    'hours_cm' => 24,
                    'hours_td' => 12,
                    'hours_tp' => 0,
                    'is_active' => true,
                ]);
                $createdModulesCount++;
            }
        }
        $this->info("Nouveaux modules Tronc Commun (S3/S4) créés : {$createdModulesCount}");

        // 2. Créer les assessments (CC1, CC2, Exam) pour tous les modules S1, S2, S3, S4 s'ils n'existent pas
        $tcModules = Module::where('filiere_id', $tc->id)->whereIn('semester_number', [1, 2, 3, 4])->get();
        $createdAssessments = 0;

        foreach ($tcModules as $mod) {
            $examAss = Assessment::where('module_id', $mod->id)->where('type', 'Exam')->first();
            if (! $examAss) {
                Assessment::create([
                    'module_id' => $mod->id,
                    'type' => 'Exam',
                    'weight' => 50.00,
                    'date' => Carbon::now()->subMonths(6),
                ]);
                $createdAssessments++;
            }

            $cc1Ass = Assessment::where('module_id', $mod->id)->where('type', 'CC1')->first();
            if (! $cc1Ass) {
                Assessment::create([
                    'module_id' => $mod->id,
                    'type' => 'CC1',
                    'weight' => 25.00,
                    'date' => Carbon::now()->subMonths(8),
                ]);
                $createdAssessments++;
            }

            $cc2Ass = Assessment::where('module_id', $mod->id)->where('type', 'CC2')->first();
            if (! $cc2Ass) {
                Assessment::create([
                    'module_id' => $mod->id,
                    'type' => 'CC2',
                    'weight' => 25.00,
                    'date' => Carbon::now()->subMonths(7),
                ]);
                $createdAssessments++;
            }
        }
        $this->info("Assessments créés : {$createdAssessments}");

        // 3. Récupérer l'étudiant Yassine Bennani (student_id = 10) ainsi que tous les étudiants en S5
        $studentsInS5 = Student::whereHas('registrations', function ($q) {
            $q->where('semester_number', 5);
        })->orWhere('id', 10)->get();

        $this->info("Étudiants concernés par l'archivage S1-S4 : " . $studentsInS5->count());

        // Barèmes types réalistes pour l'archivage avec mention bien / très bien
        $historicalScores = [
            // S1
            'TC-S1-M01' => ['cc1' => 14.0, 'cc2' => 15.0, 'exam' => 14.5], // Moy: 14.50
            'TC-S1-M02' => ['cc1' => 15.5, 'cc2' => 16.0, 'exam' => 16.0], // Moy: 15.88
            'TC-S1-M03' => ['cc1' => 13.0, 'cc2' => 14.0, 'exam' => 13.5], // Moy: 13.50
            'TC-S1-M04' => ['cc1' => 16.0, 'cc2' => 16.5, 'exam' => 16.0], // Moy: 16.12
            'TC-S1-M05' => ['cc1' => 13.5, 'cc2' => 14.5, 'exam' => 14.0], // Moy: 14.00
            'TC-S1-M06' => ['cc1' => 15.0, 'cc2' => 15.5, 'exam' => 15.0], // Moy: 15.12
            'TC-S1-M07' => ['cc1' => 14.0, 'cc2' => 14.0, 'exam' => 14.0], // Moy: 14.00
            // S2
            'TC-S2-M01' => ['cc1' => 13.5, 'cc2' => 14.0, 'exam' => 13.5], // Moy: 13.62
            'TC-S2-M02' => ['cc1' => 14.5, 'cc2' => 15.5, 'exam' => 15.0], // Moy: 15.00
            'TC-S2-M03' => ['cc1' => 13.0, 'cc2' => 13.5, 'exam' => 13.0], // Moy: 13.12
            'TC-S2-M04' => ['cc1' => 15.5, 'cc2' => 16.0, 'exam' => 15.5], // Moy: 15.62
            'TC-S2-M05' => ['cc1' => 14.0, 'cc2' => 14.5, 'exam' => 14.0], // Moy: 14.12
            'TC-S2-M06' => ['cc1' => 13.5, 'cc2' => 14.0, 'exam' => 14.0], // Moy: 13.88
            'TC-S2-M07' => ['cc1' => 15.0, 'cc2' => 15.0, 'exam' => 15.0], // Moy: 15.00
            // S3
            'TC-S3-M01' => ['cc1' => 14.0, 'cc2' => 14.5, 'exam' => 14.0], // Moy: 14.12
            'TC-S3-M02' => ['cc1' => 15.0, 'cc2' => 16.0, 'exam' => 15.5], // Moy: 15.50
            'TC-S3-M03' => ['cc1' => 13.5, 'cc2' => 14.0, 'exam' => 13.5], // Moy: 13.62
            'TC-S3-M04' => ['cc1' => 14.5, 'cc2' => 15.0, 'exam' => 14.5], // Moy: 14.62
            'TC-S3-M05' => ['cc1' => 14.0, 'cc2' => 14.5, 'exam' => 14.0], // Moy: 14.12
            'TC-S3-M06' => ['cc1' => 15.0, 'cc2' => 15.5, 'exam' => 15.0], // Moy: 15.12
            'TC-S3-M07' => ['cc1' => 16.0, 'cc2' => 16.0, 'exam' => 16.0], // Moy: 16.00
            // S4
            'TC-S4-M01' => ['cc1' => 14.0, 'cc2' => 14.5, 'exam' => 14.0], // Moy: 14.12
            'TC-S4-M02' => ['cc1' => 15.5, 'cc2' => 16.0, 'exam' => 15.5], // Moy: 15.62
            'TC-S4-M03' => ['cc1' => 13.0, 'cc2' => 13.5, 'exam' => 13.5], // Moy: 13.38
            'TC-S4-M04' => ['cc1' => 14.0, 'cc2' => 14.5, 'exam' => 14.0], // Moy: 14.12
            'TC-S4-M05' => ['cc1' => 13.5, 'cc2' => 14.0, 'exam' => 14.0], // Moy: 13.88
            'TC-S4-M06' => ['cc1' => 14.5, 'cc2' => 15.0, 'exam' => 14.5], // Moy: 14.62
            'TC-S4-M07' => ['cc1' => 15.0, 'cc2' => 15.5, 'exam' => 15.0], // Moy: 15.12
        ];

        $seededGradesCount = 0;

        foreach ($studentsInS5 as $student) {
            foreach ($tcModules as $mod) {
                $scores = $historicalScores[$mod->code] ?? ['cc1' => 14.0, 'cc2' => 14.0, 'exam' => 14.0];

                $assessments = Assessment::where('module_id', $mod->id)->get();
                foreach ($assessments as $ass) {
                    $type = strtolower($ass->type);
                    $note = $scores['exam'];
                    if (str_contains($type, 'cc1')) {
                        $note = $scores['cc1'];
                    } elseif (str_contains($type, 'cc2')) {
                        $note = $scores['cc2'];
                    }

                    Grade::updateOrCreate(
                        [
                            'student_id' => $student->id,
                            'assessment_id' => $ass->id,
                        ],
                        [
                            'value' => $note,
                            'absent' => false,
                        ]
                    );
                    $seededGradesCount++;
                }
            }
        }

        $this->info("Notes archivées injectées avec succès : {$seededGradesCount}");
        $this->info("L'étudiant a désormais son historique complet : S1, S2, S3, S4 (Archivés) et S5 (En cours).");

        return 0;
    }
}
