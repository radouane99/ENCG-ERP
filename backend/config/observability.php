<?php

return [
    'enabled' => (bool) env('OBSERVABILITY_ENABLED', false),
    'metrics_token' => env('OBSERVABILITY_METRICS_TOKEN', ''),
    'cache_store' => env('OBSERVABILITY_CACHE_STORE', 'redis'),
];
