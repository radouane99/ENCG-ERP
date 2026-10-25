<?php

// Two real PostgreSQL sessions call the production borrowing method against synthetic test data.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
use App\Http\Controllers\Api\Admin\LibraryController;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Institution;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

if (DB::connection()->getDatabaseName() !== 'encg_roles_remediation_test') {
    throw new RuntimeException('Dedicated synthetic test database required.');
}
if (($argv[1] ?? '') === 'worker') {
    [$mode, $book, $borrower, $operator, $run, $label] = array_slice($argv, 1);
    DB::statement("SET application_name = 'library_probe_".$label."'");
    $request = Request::create('/api/admin/library/borrowings', 'POST', ['user_id' => (int) $borrower, 'book_id' => (int) $book]);
    $app->instance('request', $request);
    $request->setUserResolver(fn () => User::findOrFail($operator));
    file_put_contents(storage_path('app/'.$run.'-'.$label.'.ready'), 'ready');
    try {
        $result = app(LibraryController::class)->storeBorrowing($request);
        echo json_encode(['http' => $result->getStatusCode()]);
    } catch (HttpExceptionInterface $exception) {
        echo json_encode(['http' => $exception->getStatusCode()]);
    }
    exit;
}
$run = 'library-race-'.bin2hex(random_bytes(6));
$institution = Institution::create(['name' => 'Synthetic race institution', 'code' => $run, 'slug' => $run, 'type' => 'grande_ecole']);
$actor = User::factory()->create(['institution_id' => $institution->id]);
$users = User::factory()->count(2)->create(['institution_id' => $institution->id]);
$book = Book::create(['institution_id' => $institution->id, 'title' => 'Synthetic last-copy concurrency probe', 'author' => 'Synthetic', 'isbn' => $run, 'category' => 'Test', 'total_copies' => 1, 'available_copies' => 1]);
$copy = BookCopy::create(['book_id' => $book->id, 'barcode' => $run, 'condition' => 'good', 'is_available' => true]);
$processes = [];
$pipes = [];
try {
    DB::beginTransaction();
    DB::table('books')->where('id', $book->id)->lockForUpdate()->first();
    foreach (['A', 'B'] as $index => $label) {
        $processes[$label] = proc_open(['php', __FILE__, 'worker', (string) $book->id, (string) $users[$index]->id, (string) $actor->id, $run, $label], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes[$label]);
        fclose($pipes[$label][0]);
    }
    $deadline = microtime(true) + 55;
    $waiting = 0;
    while (microtime(true) < $deadline) {
        foreach ($processes as $label => $process) {
            if (! proc_get_status($process)['running']) {
                throw new RuntimeException('Worker '.$label.' stopped: '.stream_get_contents($pipes[$label][2]).' '.stream_get_contents($pipes[$label][1]));
            }
        }
        DB::select('SELECT pg_stat_clear_snapshot()');
        $waiting = (int) DB::selectOne("SELECT count(*) AS n FROM pg_stat_activity WHERE application_name IN ('library_probe_A','library_probe_B') AND wait_event_type='Lock'")->n;
        if ($waiting === 2) {
            break;
        }
        usleep(100000);
    }
    if ($waiting !== 2) {
        throw new RuntimeException('Both workers must contend on the locked book row.');
    }
    DB::commit();
    $statuses = [];
    foreach ($processes as $label => $process) {
        $output = stream_get_contents($pipes[$label][1]);
        $stderr = stream_get_contents($pipes[$label][2]);
        fclose($pipes[$label][1]);
        fclose($pipes[$label][2]);
        $exit = proc_close($process);
        unset($processes[$label]);
        if ($exit !== 0) {
            throw new RuntimeException('Worker failure: '.$stderr.' '.$output);
        }
        $statuses[] = json_decode($output, true, flags: JSON_THROW_ON_ERROR)['http'];
    }
    sort($statuses);
    $count = DB::table('borrowings')->where('book_copy_id', $copy->id)->count();
    $remaining = (int) DB::table('books')->where('id', $book->id)->value('available_copies');
    echo json_encode(['concurrent_waiters' => $waiting, 'http_statuses' => $statuses, 'active_borrowings' => $count, 'remaining_copies' => $remaining]).PHP_EOL;
    if ($statuses !== [201, 422] || $count !== 1 || $remaining !== 0) {
        throw new RuntimeException('Last-copy invariant failed.');
    }
} finally {
    if (DB::transactionLevel()) {
        DB::rollBack();
    }
    foreach ($processes as $process) {
        proc_terminate($process);
        proc_close($process);
    }
    DB::table('borrowings')->where('book_copy_id', $copy->id)->delete();
    $copy->delete();
    $book->delete();
    DB::table('users')->whereIn('id', $users->pluck('id')->push($actor->id))->delete();
    $institution->delete();
    foreach (['A', 'B'] as $label) {
        $path = storage_path('app/'.$run.'-'.$label.'.ready');
        if (is_file($path)) {
            unlink($path);
        }
    }
}
