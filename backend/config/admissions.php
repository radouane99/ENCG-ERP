<?php

return [
    'ocr_cloud_enabled' => (bool) env('ADMISSION_OCR_CLOUD_ENABLED', false),
    'ocr_retention_days' => 30,
    'invitation_days' => 7,
];
