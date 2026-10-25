<?php

use App\Mail\SystemTestMail;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Mail;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$recipient = $argv[1] ?? '';
if (! filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('Valid test recipient required.');
}
$transport = config('mail.default');
if (in_array($transport, ['log', 'array'], true)) {
    echo json_encode(['accepted' => false, 'transport' => $transport, 'reason' => 'No outbound delivery configured.']).PHP_EOL;
    exit(1);
}
$directory = storage_path('app/audits');
if (! is_dir($directory)) {
    mkdir($directory, 0700, true);
}
$path = $directory.'/mail-test-20261025-'.substr(hash('sha256', $recipient), 0, 12).'.json';
$handle = fopen($path, 'c+');
flock($handle, LOCK_EX);
try {
    $previous = json_decode(stream_get_contents($handle), true);
    if ($previous['accepted'] ?? false) {
        echo json_encode($previous + ['already_sent' => true]).PHP_EOL;
        exit;
    }
    $message = Mail::to($recipient)->send(new SystemTestMail('Radouane — vérification technique demandée'));
    $result = ['accepted' => true, 'transport' => $transport, 'message_id' => $message?->getMessageId(), 'sent_at_utc' => gmdate('c')];
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($result, JSON_PRETTY_PRINT));
    fflush($handle);
    echo json_encode($result).PHP_EOL;
} catch (Throwable $e) {
    echo json_encode(['accepted' => false, 'transport' => $transport, 'error_type' => get_class($e), 'code' => $e->getCode()]).PHP_EOL;
    exit(1);
} finally {
    flock($handle, LOCK_UN);
    fclose($handle);
}
