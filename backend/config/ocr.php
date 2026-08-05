<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mode Performance
    |--------------------------------------------------------------------------
    */
    'performance_mode' => env('OCR_PERFORMANCE_MODE', true),
    
    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    */
    'enable_cache' => env('OCR_ENABLE_CACHE', true),
    'cache_ttl' => env('OCR_CACHE_TTL', 3600),
    'cache_prefix' => env('OCR_CACHE_PREFIX', 'ocr_'),
    
    /*
    |--------------------------------------------------------------------------
    | Limites
    |--------------------------------------------------------------------------
    */
    'max_file_size' => env('OCR_MAX_FILE_SIZE', 10 * 1024 * 1024),
    'processing_timeout' => env('OCR_PROCESSING_TIMEOUT', 15),
    'max_engines_to_try' => env('OCR_MAX_ENGINES', 2),
    
    /*
    |--------------------------------------------------------------------------
    | Quality vs Speed
    |--------------------------------------------------------------------------
    */
    'min_confidence' => env('OCR_MIN_CONFIDENCE', 0.3),
    'enable_roi' => env('OCR_ENABLE_ROI', false),
    'enable_binarization' => env('OCR_ENABLE_BINARIZATION', false),
    
    /*
    |--------------------------------------------------------------------------
    | Logging
    |--------------------------------------------------------------------------
    */
    'enable_logging' => env('OCR_ENABLE_LOGGING', false),
    'log_channel' => env('OCR_LOG_CHANNEL', 'ocr'),
    
    /*
    |--------------------------------------------------------------------------
    | Engines
    |--------------------------------------------------------------------------
    */
    'engines' => [
        'pdf_text' => [
            'enabled' => true,
            'priority' => 1,
        ],
        'tesseract' => [
            'enabled' => true,
            'priority' => 3,
            'dpi' => 200,
            'max_pages' => 1,
            'quick_mode' => true,
        ],
    ],
];