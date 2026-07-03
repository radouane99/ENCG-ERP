<?php require 'vendor/autoload.php'; \ = require_once 'bootstrap/app.php'; \->make('Illuminate\Contracts\Console\Kernel')->bootstrap(); \Log::info('PROFESSORS:', \App\Models\Professor::all()->toArray()); echo 'Done';
file_put_contents('professors_output.txt', json_encode(\App\Models\Professor::all()->toArray()));
