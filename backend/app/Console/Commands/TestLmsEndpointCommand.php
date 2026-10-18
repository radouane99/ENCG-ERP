<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\LmsCourseController;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class TestLmsEndpointCommand extends Command
{
    protected $signature = 'encg:test-lms';

    protected $description = 'Test LMS course list output for professor';

    public function handle(): int
    {
        $amina = User::where('email', 'chraibi.amina@encg-fes.ma')->first();
        if (! $amina) {
            $this->error('Amina Chraibi not found');

            return 1;
        }

        $karim = User::where('email', 'prof@encg.ma')->first();
        if ($karim) {
            $req = Request::create('/api/lms/courses', 'GET');
            $req->setUserResolver(fn () => $karim);
            $res = app(LmsCourseController::class)->index($req);
            $kData = json_decode($res->getContent(), true)['data'] ?? [];
            $this->info('Total classes returned for Pr. Karim Alami: '.count($kData));
            foreach (array_slice($kData, 0, 4) as $c) {
                $this->line(" - [ID {$c['id']}] {$c['code']}: {$c['title']} | Group: {$c['group']} | Teacher: {$c['teacher']}");
            }
        }

        return 0;
    }
}
