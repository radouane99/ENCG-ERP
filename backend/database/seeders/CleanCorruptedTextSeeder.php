<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\Professor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CleanCorruptedTextSeeder extends Seeder
{
    public function run(): void
    {
        $fixText = function (?string $str): ?string {
            if (! $str) {
                return $str;
            }

            $map = [
                '├⌐' => 'é',
                '├®' => 'é',
                '├─' => 'é',
                'Ã©' => 'é',
                '├¿' => 'è',
                'Ã¨' => 'è',
                '├ª' => 'ê',
                'Ãª' => 'ê',
                '├ë' => 'É',
                'Ã‰' => 'É',
                '|├⌐' => 'É',
                '|├®' => 'É',
                '|├──' => 'É',
                '├ ' => 'à',
                'Ã ' => 'à',
                '├á' => 'à',
                '├¢' => 'û',
                '├¹' => 'ù',
                'Ã¹' => 'ù',
                '├º' => 'ç',
                'Ã§' => 'ç',
                '├«' => 'î',
                'Ã®' => 'î',
                '├»' => 'ï',
                'Ã¯' => 'ï',
                '├┤' => 'ô',
                'Ã´' => 'ô',
                'â€™' => "'",
                'Â' => '',
            ];

            $res = strtr($str, $map);

            // Clean specific corrupted patterns
            $wordMap = [
                'Math├⌐matiques' => 'Mathématiques',
                'Math├──matiques' => 'Mathématiques',
                'Math┬ématiques' => 'Mathématiques',
                'Math|─matiques' => 'Mathématiques',
                'Math├─matiques' => 'Mathématiques',
                '|├⌐conomie' => 'Économie',
                '|├──conomie' => 'Économie',
                '├⌐conomie' => 'Économie',
                '| économie' => 'Économie',
                '|économie' => 'Économie',
                '| economie' => 'Économie',
                'G├⌐n├⌐rale' => 'Générale',
                'G├──n├──rale' => 'Générale',
                'G┬én┬érale' => 'Générale',
                'G|─n|─rale' => 'Générale',
                'G├─n├─rale' => 'Générale',
                '| n | rale' => 'Générale',
                '| n |rale' => 'Générale',
                '| n rale' => 'Générale',
                '| n |' => 'Générale',
                'Strat├⌐gique' => 'Stratégique',
                'Strat├──gique' => 'Stratégique',
                'Strat├─gique' => 'Stratégique',
                'Financi├¿re' => 'Financière',
                'Financi├──re' => 'Financière',
                'Financi├¿re' => 'Financière',
                'Soci├⌐t├⌐s' => 'Sociétés',
                'Soci├──t├──s' => 'Sociétés',
                'Comptabilit├⌐' => 'Comptabilité',
                'Comptabilit├──' => 'Comptabilité',
                'Mon├⌐taire' => 'Monétaire',
                'Num├⌐rique' => 'Numérique',
                '├ëcole' => 'École',
                '├ëtudes' => 'Études',
                '├ëvaluation' => 'Évaluation',
            ];

            foreach ($wordMap as $search => $replace) {
                $res = str_replace($search, $replace, $res);
            }

            // Clean leading pipe and weird ASCII glitches
            $res = preg_replace('/^[\|\s]*[éeEÉ]conomie\s*G[^\w\s]*n[^\w\s]*rale\s*(I+)/u', 'Économie Générale $1', $res);
            $res = preg_replace('/Math[^\w\s]*matiques\s*pour\s*la\s*Gestion/u', 'Mathématiques pour la Gestion', $res);
            $res = preg_replace('/Économie\s*G[^\w\s]*n[^\w\s]*rale/u', 'Économie Générale', $res);
            $res = preg_replace('/Management\s*Strat[^\w\s]*gique/u', 'Management Stratégique', $res);
            $res = preg_replace('/Analyse\s*Financi[^\w\s]*re/u', 'Analyse Financière', $res);
            $res = preg_replace('/Fiscalit[^\w\s]*\s*des\s*Entreprises/u', 'Fiscalité des Entreprises', $res);
            $res = preg_replace('/Droit\s*des\s*Soci[^\w\s]*t[^\w\s]*s/u', 'Droit des Sociétés', $res);
            $res = preg_replace('/[├┬Γ]/u', '', $res);

            return trim($res);
        };

        // 1. Clean all Modules
        $modules = Module::all();
        foreach ($modules as $m) {
            $cleaned = $fixText($m->name);
            if ($cleaned !== $m->name) {
                $m->update(['name' => $cleaned]);
            }
        }

        // 2. Clean all Filieres
        $filieres = Filiere::all();
        foreach ($filieres as $f) {
            $cleaned = $fixText($f->name);
            if ($cleaned !== $f->name) {
                $f->update(['name' => $cleaned]);
            }
        }

        // 3. Clean all Departments
        $departments = Department::all();
        foreach ($departments as $d) {
            $cleanedName = $fixText($d->name);
            $cleanedHead = $fixText($d->head_name);
            if ($cleanedName !== $d->name || $cleanedHead !== $d->head_name) {
                $d->update(['name' => $cleanedName, 'head_name' => $cleanedHead]);
            }
        }

        // 4. Clean all Professors
        $profs = Professor::all();
        foreach ($profs as $p) {
            $cleanedSpec = $fixText($p->specialty);
            if ($cleanedSpec !== $p->specialty) {
                $p->update(['specialty' => $cleanedSpec]);
            }
        }

        // 5. Clean Users
        $users = User::all();
        foreach ($users as $u) {
            $cleanedName = $fixText($u->name);
            $cleanedFirst = $fixText($u->first_name);
            $cleanedLast = $fixText($u->last_name);
            if ($cleanedName !== $u->name || $cleanedFirst !== $u->first_name || $cleanedLast !== $u->last_name) {
                $u->update(['name' => $cleanedName, 'first_name' => $cleanedFirst, 'last_name' => $cleanedLast]);
            }
        }
    }
}
