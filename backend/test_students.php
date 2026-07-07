<?php
require 'vendor/autoload.php';
\ = require_once 'bootstrap/app.php';
\ = \->make(Illuminate\Contracts\Console\Kernel::class);
\->bootstrap();

\ = app(\App\Services\StudentService::class);
\ = \->getPaginatedStudents([]);
file_put_contents('storage/logs/debug.json', json_encode(\->mapStudentCollection(\)));
