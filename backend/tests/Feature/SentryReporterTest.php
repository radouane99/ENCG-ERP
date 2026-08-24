<?php

use App\Support\SentryReporter;

it('does not attempt a network call when the Sentry DSN is empty', function () {
    config(['services.sentry.dsn' => '']);

    expect(fn () => app(SentryReporter::class)->capture(new RuntimeException('ignored')))
        ->not->toThrow(Throwable::class);
});
