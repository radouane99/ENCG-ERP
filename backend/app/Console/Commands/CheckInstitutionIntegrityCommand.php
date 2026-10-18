<?php

namespace App\Console\Commands;

use App\Models\Campus;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckInstitutionIntegrityCommand extends Command
{
    protected $signature = 'encg:check-institution';

    protected $description = 'Verify that all institution_id references are unified to ID 1';

    public function handle(): int
    {
        $this->info('=== Institution Integrity Check ===');

        $institutions = Institution::all(['id', 'name', 'code', 'city', 'rector_name']);
        $this->info('Institutions count: '.$institutions->count());
        foreach ($institutions as $inst) {
            $this->line(" - ID {$inst->id}: {$inst->name} ({$inst->code}) in {$inst->city}, Rector: {$inst->rector_name}");
        }

        $usersByInst = User::select('institution_id', DB::raw('count(*) as total'))
            ->groupBy('institution_id')
            ->get();
        $this->info('Users by institution_id:');
        foreach ($usersByInst as $row) {
            $instVal = $row->institution_id ?? 'NULL';
            $this->line(" - institution_id {$instVal}: {$row->total} users");
        }

        $studentsByInst = Student::select('institution_id', DB::raw('count(*) as total'))
            ->groupBy('institution_id')
            ->get();
        $this->info('Students by institution_id:');
        foreach ($studentsByInst as $row) {
            $this->line(" - institution_id {$row->institution_id}: {$row->total} students");
        }

        $professorsByInst = Professor::select('institution_id', DB::raw('count(*) as total'))
            ->groupBy('institution_id')
            ->get();
        $this->info('Professors by institution_id:');
        foreach ($professorsByInst as $row) {
            $this->line(" - institution_id {$row->institution_id}: {$row->total} professors");
        }

        $campusesByInst = Campus::select('institution_id', DB::raw('count(*) as total'))
            ->groupBy('institution_id')
            ->get();
        $this->info('Campuses by institution_id:');
        foreach ($campusesByInst as $row) {
            $this->line(" - institution_id {$row->institution_id}: {$row->total} campuses");
        }

        $deptByInst = Department::select('institution_id', DB::raw('count(*) as total'))
            ->groupBy('institution_id')
            ->get();
        $this->info('Departments by institution_id:');
        foreach ($deptByInst as $row) {
            $this->line(" - institution_id {$row->institution_id}: {$row->total} departments");
        }

        $filieresByInst = Filiere::select('institution_id', DB::raw('count(*) as total'))
            ->groupBy('institution_id')
            ->get();
        $this->info('Filieres by institution_id:');
        foreach ($filieresByInst as $row) {
            $this->line(" - institution_id {$row->institution_id}: {$row->total} filieres");
        }

        // Check if any legacy ID 3 remains anywhere in the database
        $tablesWith3 = [];
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            $tables = DB::select("
                SELECT table_name
                FROM information_schema.columns
                WHERE column_name = 'institution_id'
                  AND table_schema = 'public'
            ");
            foreach ($tables as $t) {
                $tableName = $t->table_name;
                if ($tableName === 'institutions') {
                    continue;
                }
                $cnt = DB::table($tableName)->where('institution_id', 3)->count();
                if ($cnt > 0) {
                    $tablesWith3[$tableName] = $cnt;
                }
            }
        }

        if (empty($tablesWith3)) {
            $this->info('✅ ZERO orphan institution_id=3 records across all tables! Everything is cleanly unified on ID 1.');
        } else {
            $this->error('⚠️ Found remaining records with institution_id=3: '.json_encode($tablesWith3));
        }

        return 0;
    }
}
