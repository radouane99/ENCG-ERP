<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== CLUBS ===\n";
$clubs = App\Models\Club::withCount('members')->get();
foreach ($clubs as $c) {
    echo "ID: {$c->id} | Name: {$c->name} | Category: {$c->category} | Pres: {$c->president_name} | Members: {$c->members_count}\n";
    echo "Desc: {$c->description}\n\n";
}

echo "=== EVENTS ===\n";
$events = App\Models\ClubEvent::with('club')->get();
foreach ($events as $e) {
    echo "ID: {$e->id} | Club: {$e->club?->name} | Title: {$e->title} | Location: {$e->location} | Start: {$e->start_at}\n";
    echo "Desc: {$e->description}\n\n";
}
