<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateOfficialTimetableCommand extends Command
{
    protected $signature = 'encg:generate-timetable {--force : Exécuter sans confirmation}';

    protected $description = 'Génère l\'emploi du temps officiel ENCG Fès sans aucun conflit, aligné aux spécialités des professeurs et aux règles académiques';

    public function handle(): int
    {
        $this->info('================================================================');
        $this->info('🎓 DÉPLOIEMENT DE L\'EMPLOI DU TEMPS OFFICIEL ENCG FÈS');
        $this->info('================================================================');

        $institution = Institution::first();
        $institutionId = $institution?->id ?? 1;

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        if (! $academicYear) {
            $this->error('❌ Aucune année académique trouvée.');

            return Command::FAILURE;
        }

        $campus = Campus::first();
        $campusId = $campus?->id;

        // 1. Assurer l'existence de toutes les salles nécessaires
        $this->info('--- 1. Vérification et provisionnement des Salles du Campus ---');
        $roomsBlueprint = [
            ['name' => 'Amphithéâtre A', 'code' => 'AMPH-A', 'type' => 'amphitheater', 'capacity' => 320],
            ['name' => 'Amphithéâtre B', 'code' => 'AMPH-B', 'type' => 'amphitheater', 'capacity' => 250],
            ['name' => 'Salle 101', 'code' => 'S-101', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 102', 'code' => 'S-102', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 103', 'code' => 'S-103', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 104', 'code' => 'S-104', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 105', 'code' => 'S-105', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 106', 'code' => 'S-106', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 107', 'code' => 'S-107', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 108', 'code' => 'S-108', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle Informatique I', 'code' => 'INFO-1', 'type' => 'lab', 'capacity' => 35],
            ['name' => 'Salle Informatique II', 'code' => 'INFO-2', 'type' => 'lab', 'capacity' => 35],
        ];

        foreach ($roomsBlueprint as $rb) {
            Room::firstOrCreate(
                ['code' => $rb['code']],
                [
                    'institution_id' => $institutionId,
                    'campus_id' => $campusId,
                    'name' => $rb['name'],
                    'type' => $rb['type'],
                    'capacity' => $rb['capacity'],
                    'has_projector' => true,
                    'has_ac' => true,
                    'is_available' => true,
                ]
            );
        }
        $rooms = Room::all()->keyBy('code');
        $this->info("✅ {$rooms->count()} salles prêtes.");

        // 2. Récupérer les professeurs par email ou spécialité
        $this->newLine();
        $this->info('--- 2. Chargement du Corps Professoral par Spécialité ---');

        $findProf = function (string $email, ?string $fallbackName = null) {
            $user = User::where('email', $email)->first();
            if ($user && $user->professor) {
                return $user->professor;
            }
            if ($fallbackName) {
                $p = Professor::whereHas('user', fn ($q) => $q->where('name', 'like', "%{$fallbackName}%"))->first();
                if ($p) {
                    return $p;
                }
            }

            return Professor::first();
        };

        // Enseignants clés
        $profAminaChraibi = $findProf('chraibi.amina@encg-fes.ma', 'Amina Chraibi');       // Management / Marketing
        $profKarimAlami = $findProf('prof@encg.ma', 'Karim Alami');                      // Finance / Compta
        $profTarikMeziane = $findProf('meziane.tarik@encg-fes.ma', 'Tarik Meziane');        // Droit
        $profBouchraBennani = $findProf('bennani.bouchra@encg-fes.ma', 'Bouchra Bennani');    // Langues / Com
        $profMohamedBenjIG = $findProf('benjelloun.mohamed@encg-fes.ma', 'Mohamed Benjelloun'); // Informatique
        $profSaraBenmoussa = $findProf('s.benmoussa@encg-fes.ac.ma', 'Sara Benmoussa');    // Marketing
        $profYoussefChraibi = $findProf('y.chraibi@encg-fes.ac.ma', 'Youssef Chraibi');      // Comptabilité
        $profAbdelhakAmrani = $findProf('a.elamrani@encg-fes.ac.ma', 'Abdelhak El Amrani');  // Finance
        $profMohamedBenjEA = $findProf('m.benjelloun@encg-fes.ac.ma', 'Benjelloun');        // Économie / Stats
        $profFatimaBensouda = $findProf('fatima.bensouda@encg-fes.ma', 'Fatima Bensouda');  // Finance / Gestion
        $profLaylaBerrada = $findProf('l.berrada@encg-fes.ac.ma', 'Layla Berrada');        // Anglais
        $profKarimIdrissi = $findProf('k.idrissi@encg-fes.ac.ma', 'Karim Idrissi');        // Communication

        $this->info("✅ Professeurs identifiés : Amina Chraibi (ID:{$profAminaChraibi->id}), Karim Alami (ID:{$profKarimAlami->id}), etc.");

        // 3. Charger les groupes et semestres
        $this->newLine();
        $this->info('--- 3. Groupes Cibles ---');
        $groups = Group::with('filiere')->get()->keyBy('name');
        foreach ($groups as $gName => $g) {
            $this->line("   - {$gName} (Filière: {$g->filiere?->code}, S{$g->semester_number})");
        }

        // Semestres
        $semesters = Semester::all()->keyBy('number');
        $sem2 = $semesters->get(2) ?? Semester::where('is_current', true)->first();
        $sem5 = $semesters->get(5) ?? $semesters->get(1) ?? $sem2;

        // Modules
        $modules = Module::all()->keyBy('code');

        // 4. Définir la grille pédagogique complète et équilibrée
        // Time slots standard :
        // M1: 08:30:00 - 10:15:00
        // M2: 10:30:00 - 12:15:00
        // A1: 14:30:00 - 16:15:00
        // A2: 16:30:00 - 18:15:00
        $tM1 = ['start' => '08:30:00', 'end' => '10:15:00'];
        $tM2 = ['start' => '10:30:00', 'end' => '12:15:00'];
        $tA1 = ['start' => '14:30:00', 'end' => '16:15:00'];
        $tA2 = ['start' => '16:30:00', 'end' => '18:15:00'];

        // Grille officielle planifiée (Day: 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi)
        $schedulePlan = [
            // =========================================================================
            // LUNDI (Day 1)
            // =========================================================================
            // M1 (08:30-10:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M05', // Marketing de Base
                'prof' => $profAminaChraibi, 'room' => 'AMPH-A', 'day' => 1, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M01', // Comptabilité Approfondie
                'prof' => $profYoussefChraibi, 'room' => 'S-101', 'day' => 1, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M01', // Comportement du Consommateur
                'prof' => $profSaraBenmoussa, 'room' => 'S-102', 'day' => 1, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // M2 (10:30-12:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M05', // Marketing de Base
                'prof' => $profAminaChraibi, 'room' => 'AMPH-A', 'day' => 1, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M01', // Comptabilité Approfondie
                'prof' => $profYoussefChraibi, 'room' => 'S-101', 'day' => 1, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M01', // Comportement du Consommateur
                'prof' => $profSaraBenmoussa, 'room' => 'S-102', 'day' => 1, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A1 (14:30-16:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M04', // Langue Anglaise II
                'prof' => $profBouchraBennani, 'room' => 'S-103', 'day' => 1, 'time' => $tA1, 'type' => 'td', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M07', // Anglais des Affaires
                'prof' => $profLaylaBerrada, 'room' => 'S-104', 'day' => 1, 'time' => $tA1, 'type' => 'td', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M07', // Anglais du Marketing
                'prof' => $profKarimIdrissi, 'room' => 'S-105', 'day' => 1, 'time' => $tA1, 'type' => 'td', 'sem' => $sem5,
            ],

            // A2 (16:30-18:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M04', // Langue Anglaise II
                'prof' => $profBouchraBennani, 'room' => 'S-103', 'day' => 1, 'time' => $tA2, 'type' => 'td', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M07', // Anglais des Affaires
                'prof' => $profLaylaBerrada, 'room' => 'S-104', 'day' => 1, 'time' => $tA2, 'type' => 'td', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M07', // Anglais du Marketing
                'prof' => $profKarimIdrissi, 'room' => 'S-105', 'day' => 1, 'time' => $tA2, 'type' => 'td', 'sem' => $sem5,
            ],

            // =========================================================================
            // MARDI (Day 2)
            // =========================================================================
            // M1 (08:30-10:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M02', // Comptabilité Générale II
                'prof' => $profKarimAlami, 'room' => 'AMPH-B', 'day' => 2, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M02', // Analyse Financière
                'prof' => $profAbdelhakAmrani, 'room' => 'S-101', 'day' => 2, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M04', // Études de Marché
                'prof' => $profSaraBenmoussa, 'room' => 'S-102', 'day' => 2, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // M2 (10:30-12:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M02', // Comptabilité Générale II
                'prof' => $profKarimAlami, 'room' => 'AMPH-B', 'day' => 2, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M02', // Analyse Financière
                'prof' => $profAbdelhakAmrani, 'room' => 'S-101', 'day' => 2, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M04', // Études de Marché
                'prof' => $profSaraBenmoussa, 'room' => 'S-102', 'day' => 2, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A1 (14:30-16:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M06', // Informatique de Gestion II
                'prof' => $profMohamedBenjIG, 'room' => 'INFO-1', 'day' => 2, 'time' => $tA1, 'type' => 'tp', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M03', // Contrôle de Gestion
                'prof' => $profFatimaBensouda, 'room' => 'S-103', 'day' => 2, 'time' => $tA1, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M05', // Management de la Force de Vente
                'prof' => $profAminaChraibi, 'room' => 'S-106', 'day' => 2, 'time' => $tA1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A2 (16:30-18:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M06', // Informatique de Gestion II
                'prof' => $profMohamedBenjIG, 'room' => 'INFO-1', 'day' => 2, 'time' => $tA2, 'type' => 'tp', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M03', // Contrôle de Gestion
                'prof' => $profFatimaBensouda, 'room' => 'S-103', 'day' => 2, 'time' => $tA2, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M05', // Management de la Force de Vente
                'prof' => $profAminaChraibi, 'room' => 'S-106', 'day' => 2, 'time' => $tA2, 'type' => 'cm', 'sem' => $sem5,
            ],

            // =========================================================================
            // MERCREDI (Day 3)
            // =========================================================================
            // M1 (08:30-10:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M01', // Statistiques et Probabilités
                'prof' => $profMohamedBenjEA, 'room' => 'AMPH-A', 'day' => 3, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M02', // Marketing Stratégique
                'prof' => $profAminaChraibi, 'room' => 'S-101', 'day' => 3, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M04', // Fiscalité des Entreprises
                'prof' => $profYoussefChraibi, 'room' => 'S-102', 'day' => 3, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // M2 (10:30-12:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M01', // Statistiques et Probabilités
                'prof' => $profMohamedBenjEA, 'room' => 'AMPH-A', 'day' => 3, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M02', // Marketing Stratégique
                'prof' => $profAminaChraibi, 'room' => 'S-101', 'day' => 3, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M04', // Fiscalité des Entreprises
                'prof' => $profYoussefChraibi, 'room' => 'S-102', 'day' => 3, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A1 (14:30-16:15)
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M06', // Droit des Sociétés
                'prof' => $profTarikMeziane, 'room' => 'S-103', 'day' => 3, 'time' => $tA1, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M03', // Communication Marketing Intégrée
                'prof' => $profKarimIdrissi, 'room' => 'S-104', 'day' => 3, 'time' => $tA1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A2 (16:30-18:15)
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M06', // Droit des Sociétés
                'prof' => $profTarikMeziane, 'room' => 'S-103', 'day' => 3, 'time' => $tA2, 'type' => 'cm', 'sem' => $sem5,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M03', // Communication Marketing Intégrée
                'prof' => $profKarimIdrissi, 'room' => 'S-104', 'day' => 3, 'time' => $tA2, 'type' => 'cm', 'sem' => $sem5,
            ],

            // =========================================================================
            // JEUDI (Day 4)
            // =========================================================================
            // M1 (08:30-10:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M03', // Économie Générale II
                'prof' => $profMohamedBenjEA, 'room' => 'AMPH-B', 'day' => 4, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M05', // Finance d'Entreprise
                'prof' => $profKarimAlami, 'room' => 'S-101', 'day' => 4, 'time' => $tM1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // M2 (10:30-12:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M03', // Économie Générale II
                'prof' => $profMohamedBenjEA, 'room' => 'AMPH-B', 'day' => 4, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M05', // Finance d'Entreprise
                'prof' => $profKarimAlami, 'room' => 'S-101', 'day' => 4, 'time' => $tM2, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A1 (14:30-16:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M07', // Soft Skills II
                'prof' => $profBouchraBennani, 'room' => 'S-105', 'day' => 4, 'time' => $tA1, 'type' => 'td', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G1', 'module' => 'GFC-S5-M02', // TD Analyse Financière
                'prof' => $profAbdelhakAmrani, 'room' => 'S-107', 'day' => 4, 'time' => $tA1, 'type' => 'td', 'sem' => $sem5,
            ],

            // A2 (16:30-18:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M07', // Soft Skills II
                'prof' => $profBouchraBennani, 'room' => 'S-105', 'day' => 4, 'time' => $tA2, 'type' => 'td', 'sem' => $sem2,
            ],
            [
                'group' => 'GFC-S5-G2', 'module' => 'GFC-S5-M02', // TD Analyse Financière
                'prof' => $profAbdelhakAmrani, 'room' => 'S-107', 'day' => 4, 'time' => $tA2, 'type' => 'td', 'sem' => $sem5,
            ],

            // =========================================================================
            // VENDREDI (Day 5)
            // =========================================================================
            // M1 (08:30-10:15)
            [
                'group' => 'TC-S2-G1', 'module' => 'TC-S2-M02', // TD Comptabilité Générale II
                'prof' => $profFatimaBensouda, 'room' => 'S-101', 'day' => 5, 'time' => $tM1, 'type' => 'td', 'sem' => $sem2,
            ],
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M02', // TD Marketing Stratégique
                'prof' => $profSaraBenmoussa, 'room' => 'S-102', 'day' => 5, 'time' => $tM1, 'type' => 'td', 'sem' => $sem5,
            ],

            // M2 (10:30-12:15)
            [
                'group' => 'TC-S2-G2', 'module' => 'TC-S2-M02', // TD Comptabilité Générale II
                'prof' => $profFatimaBensouda, 'room' => 'S-101', 'day' => 5, 'time' => $tM2, 'type' => 'td', 'sem' => $sem2,
            ],
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M02', // TD Marketing Stratégique
                'prof' => $profSaraBenmoussa, 'room' => 'S-102', 'day' => 5, 'time' => $tM2, 'type' => 'td', 'sem' => $sem5,
            ],

            // A1 (14:30-16:15)
            [
                'group' => 'MCM-S5-G1', 'module' => 'MCM-S5-M06', // Droit Commercial
                'prof' => $profTarikMeziane, 'room' => 'S-103', 'day' => 5, 'time' => $tA1, 'type' => 'cm', 'sem' => $sem5,
            ],

            // A2 (16:30-18:15)
            [
                'group' => 'MCM-S5-G2', 'module' => 'MCM-S5-M06', // Droit Commercial
                'prof' => $profTarikMeziane, 'room' => 'S-103', 'day' => 5, 'time' => $tA2, 'type' => 'cm', 'sem' => $sem5,
            ],
        ];

        $this->info('Nombre de créneaux officiels structurés : '.count($schedulePlan));

        // 5. Mettre à jour module_professor pour synchroniser exactement avec cette grille
        $this->newLine();
        $this->info('--- 4. Synchronisation Canonique de la Table module_professor ---');

        DB::transaction(function () use ($schedulePlan, $academicYear, $institutionId, $modules, $groups, $rooms) {
            // Nettoyer module_professor
            DB::table('module_professor')->truncate();

            $syncedPairs = [];
            foreach ($schedulePlan as $entry) {
                $modObj = $modules->get($entry['module']);
                $grpObj = $groups->get($entry['group']);
                $profObj = $entry['prof'];

                if (! $modObj || ! $grpObj || ! $profObj) {
                    continue;
                }

                $key = "{$modObj->id}_{$profObj->id}";
                if (! isset($syncedPairs[$key])) {
                    DB::table('module_professor')->insert([
                        'module_id' => $modObj->id,
                        'professor_id' => $profObj->id,
                        'professor_type' => Professor::class,
                        'group_id' => $grpObj->id,
                        'academic_year_id' => $academicYear->id,
                        'session_type' => $entry['type'],
                        'assigned_hours' => ($entry['type'] === 'cm') ? 30 : 15,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $syncedPairs[$key] = true;
                }
            }
            $this->info('✅ '.count($syncedPairs).' associations enregistrées dans module_professor.');

            // 6. Nettoyer et réinsérer dans schedules
            $oldCount = Schedule::count();
            Schedule::query()->delete();
            $this->warn("🗑️ {$oldCount} anciens créneaux supprimés de la table schedules.");

            $insertedCount = 0;
            foreach ($schedulePlan as $entry) {
                $modObj = $modules->get($entry['module']);
                $grpObj = $groups->get($entry['group']);
                $profObj = $entry['prof'];
                $roomObj = $rooms->get($entry['room']);

                if (! $modObj || ! $grpObj || ! $profObj || ! $roomObj) {
                    $this->warn('⚠️ Entrée ignorée car ressource manquante : '.json_encode($entry));

                    continue;
                }

                Schedule::create([
                    'institution_id' => $institutionId,
                    'academic_year_id' => $academicYear->id,
                    'semester_id' => $entry['sem']->id,
                    'module_id' => $modObj->id,
                    'professor_id' => $profObj->id,
                    'professor_type' => Professor::class,
                    'group_id' => $grpObj->id,
                    'room_id' => $roomObj->id,
                    'day_of_week' => $entry['day'],
                    'start_time' => $entry['time']['start'],
                    'end_time' => $entry['time']['end'],
                    'session_type' => $entry['type'],
                    'recurrence' => 'weekly',
                    'is_active' => true,
                    'version' => 1,
                ]);
                $insertedCount++;
            }

            $this->info("✅ {$insertedCount} nouveaux créneaux officiels enregistrés avec succès !");
        });

        // 7. Exécuter l'audit immédiatement pour valider le résultat
        $this->newLine();
        $this->call('encg:audit-schedule');

        return Command::SUCCESS;
    }
}
