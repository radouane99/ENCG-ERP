<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Monitoring\RuntimeMetrics;
use Illuminate\Http\Request;

final class MetricsController extends Controller
{
    public function __invoke(Request $request, RuntimeMetrics $metrics)
    {
        $token = (string) config('observability.metrics_token');
        abort_unless(config('observability.enabled') && strlen($token) >= 32, 404);
        abort_unless(hash_equals($token, (string) $request->bearerToken()), 401);

        return response($metrics->render(), 200, ['Content-Type' => 'text/plain; version=0.0.4; charset=utf-8', 'Cache-Control' => 'no-store']);
    }
}
