<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$students = \App\Models\Student::with("user")->limit(15)->get()->map(function($s){
    return ["id"=>$s->id, "name"=>$s->user->first_name." ".$s->user->last_name, "student_number" => $s->student_number];
});
file_put_contents('debug_students.json', json_encode($students));
