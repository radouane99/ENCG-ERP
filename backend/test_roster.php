<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Test retrieving groups and students for group 1
$group = \App\Models\Group::first();
if ($group) {
    echo "Group: " . $group->name . " (ID: " . $group->id . ")\n";

    // Section complete count
    $allCount = \App\Models\Student::whereHas('pathways', function ($p) use ($group) {
        $p->where('group_id', $group->id)->where('is_current', true);
    })->count();
    echo "Section complete count: " . $allCount . "\n";

    // G1.1 count
    $g11Count = \App\Models\Student::whereHas('pathways', function ($p) use ($group) {
        $p->where('group_id', $group->id)->where('is_current', true)->where('sub_group', 'G1.1');
    })->count();
    echo "G1.1 sub_group count: " . $g11Count . "\n";
} else {
    echo "No group found\n";
}
