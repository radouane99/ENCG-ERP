<?php
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$recipient = $argv[1] ?? '';
if (! filter_var($recipient, FILTER_VALIDATE_EMAIL)) { throw new InvalidArgumentException('Valid test recipient required.'); }
$client = \Resend::client(config('services.resend.key'));
$result = ['sender' => config('mail.from.address')];
try {
    $currentDomain = substr(strrchr(config('mail.from.address'), '@'), 1);
    $result['domains'] = [];
    foreach ($client->domains->list()->data as $domain) {
        if (in_array($domain->name, [$currentDomain, 'encg-fes.ac.ma'], true)) { $result['domains'][] = ['name' => $domain->name, 'status' => $domain->status]; }
    }
} catch (\Throwable $e) { $result['domain_check_unavailable'] = ['type' => method_exists($e, 'getErrorType') ? $e->getErrorType() : get_class($e), 'status' => method_exists($e, 'getErrorCode') ? $e->getErrorCode() : $e->getCode()]; }
try {
    $result['matching_test_messages'] = [];
    foreach ($client->emails->list(['limit' => 10])->data as $mail) {
        if (in_array($recipient, (array) $mail->to, true) && $mail->subject === 'Test de messagerie du portail ENCG') {
            $detail = $client->emails->get($mail->id);
            $result['matching_test_messages'][] = ['provider_id' => $detail->id, 'last_event' => $detail->last_event, 'created_at' => $detail->created_at];
        }
    }
} catch (\Throwable $e) { $result['delivery_check_unavailable'] = ['type' => method_exists($e, 'getErrorType') ? $e->getErrorType() : get_class($e), 'status' => method_exists($e, 'getErrorCode') ? $e->getErrorCode() : $e->getCode()]; }
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT).PHP_EOL;
