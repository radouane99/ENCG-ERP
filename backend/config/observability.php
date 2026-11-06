<?php

return [
    'enabled' => (bool) env('OBSERVABILITY_ENABLED', false),
    'metrics_token' => env('OBSERVABILITY_METRICS_TOKEN', ''),
    'cache_store' => env('OBSERVABILITY_CACHE_STORE', 'redis'),
    'operations_only_scheduler' => (bool) env('OPERATIONS_ONLY_SCHEDULER', false),
    'alert_email' => env('OPERATIONS_ALERT_EMAIL'),
    'alert_cache_store' => env('OPERATIONS_ALERT_CACHE_STORE', 'file'),
    'prometheus_url' => env('OPERATIONS_PROMETHEUS_URL', 'http://encg-observability-prometheus-1:9090'),
];
