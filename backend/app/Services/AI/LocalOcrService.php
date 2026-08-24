<?php

namespace App\Services\AI;

use App\OCR\Contracts\DocumentParserInterface;
use App\OCR\Contracts\DocumentParserManager;
use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\Engines\GroqLlamaEngine;
use App\OCR\Engines\PdfBinaryEngine;
use App\OCR\Engines\PdfTextEngine;
use App\OCR\Engines\TesseractEngine;
use App\OCR\OcrPipeline;
use App\OCR\OcrResult;
use App\OCR\Parsers\BacParser;
use App\OCR\Parsers\CnieParser;
use App\OCR\Parsers\ReleveParser;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Local OCR Service - Version Finale Optimisée
 *
 * Gère l'extraction OCR locale avec pipeline, cache, validation et fallbacks
 */
class LocalOcrService
{
    private OcrPipeline $pipeline;

    private DocumentParserManager $parserManager;

    private ?string $lastError = null;

    private array $config;

    private array $stats = [];

    /**
     * Configuration par défaut
     */
    private array $defaultConfig = [
        'enable_cache' => true,
        'cache_ttl' => 3600, // 1 heure
        'cache_prefix' => 'ocr_',
        'enable_logging' => true,
        'enable_fallback_parsers' => true,
        'max_file_size' => 20 * 1024 * 1024, // 20MB
        'supported_mime_types' => [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/tiff',
            'image/bmp',
            'image/gif',
        ],
        'min_confidence_threshold' => 0.4,
        'enable_auto_detect' => true,
        'enable_text_cleanup' => true,
    ];

    /**
     * @param  iterable<DocumentParserInterface>  $parsers
     * @param  iterable<OcrEngineInterface>  $engines
     * @param  array  $config  Configuration supplémentaire
     */
    public function __construct(
        iterable $parsers = [],
        iterable $engines = [],
        array $config = []
    ) {
        $this->config = array_merge($this->defaultConfig, $config);
        $this->stats = [
            'total_processed' => 0,
            'successful' => 0,
            'failed' => 0,
            'cache_hits' => 0,
            'engines_used' => [],
        ];

        // Initialisation du pipeline
        $this->pipeline = new OcrPipeline($this->config);

        // Conversion des iterables en tableaux
        $engineList = is_array($engines) ? $engines : iterator_to_array($engines);
        $parserList = is_array($parsers) ? $parsers : iterator_to_array($parsers);

        // 1. Enregistrement des engines
        if (empty($engineList)) {
            $engineList = [
                new PdfTextEngine,
                new PdfBinaryEngine,
                new GroqLlamaEngine,
                new TesseractEngine,
            ];
        }

        foreach ($engineList as $engine) {
            if ($engine instanceof OcrEngineInterface) {
                $this->pipeline->addEngine($engine);
                if ($this->config['enable_logging']) {
                    Log::debug('[LocalOcrService] Engine registered: '.get_class($engine));
                }
            }
        }

        // 2. Enregistrement des parsers via DocumentParserManager
        $this->parserManager = new DocumentParserManager($this->config);

        if (empty($parserList)) {
            $parserList = [
                new BacParser,
                new CnieParser,
                new ReleveParser,
            ];
        }

        foreach ($parserList as $parser) {
            if ($parser instanceof DocumentParserInterface) {
                $this->parserManager->registerParser($parser);
                if ($this->config['enable_logging']) {
                    Log::debug('[LocalOcrService] Parser registered: '.get_class($parser));
                }
            }
        }

        // 3. Enregistrement des parsers dans le pipeline (rétrocompatibilité)
        foreach ($parserList as $parser) {
            if ($parser instanceof DocumentParserInterface) {
                $this->pipeline->addParser($parser);
            }
        }

        if ($this->config['enable_logging']) {
            Log::info('[LocalOcrService] Initialized with '.count($engineList).' engines and '.count($parserList).' parsers');
        }
    }

    /**
     * Méthode principale d'extraction OCR
     */
    public function extractDocumentOcr(
        string $filePath,
        string $mimeType,
        ?string $originalName = null,
        string $docType = 'unknown'
    ): array {
        $this->lastError = null;
        $startTime = microtime(true);
        $this->stats['total_processed']++;

        // Validation du fichier
        $validationResult = $this->validateFile($filePath, $mimeType);
        if (! $validationResult['valid']) {
            $this->lastError = $validationResult['error'];
            $this->stats['failed']++;

            return $this->createErrorResponse($validationResult['error']);
        }

        // Génération du cache key
        $cacheKey = $this->generateCacheKey($filePath, $originalName, $docType);

        // Vérification du cache
        if ($this->config['enable_cache']) {
            $cachedResult = $this->getFromCache($cacheKey);
            if ($cachedResult !== null) {
                $this->stats['cache_hits']++;
                if ($this->config['enable_logging']) {
                    Log::debug("[LocalOcrService] Cache hit for: {$cacheKey}");
                }

                return $cachedResult;
            }
        }

        try {
            // Vérification du type de document (auto-détection)
            $detectedDocType = $docType;
            if ($this->config['enable_auto_detect'] && $docType === 'unknown') {
                $detectedDocType = $this->detectDocumentTypeFromFile($filePath);
            }

            // Traitement OCR via pipeline
            $ocrResult = $this->pipeline->process($filePath, $mimeType, $detectedDocType);

            // Extraction du texte
            $extractedText = $this->extractTextFromResult($ocrResult);

            if (empty(trim($extractedText))) {
                $this->lastError = "Aucun texte n'a pu être extrait du document localement.";
                $this->stats['failed']++;

                if ($this->config['enable_logging']) {
                    Log::warning("[LocalOcrService] Empty extraction for: {$filePath} (DocType: {$docType})");
                }

                return $this->createEmptyResponse($filePath, $detectedDocType);
            }

            // Nettoyage du texte
            if ($this->config['enable_text_cleanup']) {
                $extractedText = $this->cleanExtractedText($extractedText);
            }

            // Parsing du document
            $parsedResult = $this->parseDocument($extractedText, $detectedDocType);

            // Construction de la réponse
            $response = $this->buildResponse($extractedText, $parsedResult, $ocrResult, $filePath, $detectedDocType);

            // Mise en cache
            if ($this->config['enable_cache']) {
                $this->storeInCache($cacheKey, $response);
            }

            // Mise à jour des statistiques
            $this->stats['successful']++;
            $this->stats['engines_used'] = array_merge(
                $this->stats['engines_used'],
                $this->getEnginesUsed($ocrResult)
            );

            if ($this->config['enable_logging']) {
                Log::info("[LocalOcrService] Successfully processed: {$filePath}", [
                    'doc_type' => $detectedDocType,
                    'text_length' => strlen($extractedText),
                    'duration' => round(microtime(true) - $startTime, 2).'s',
                    'confidence' => $this->getConfidence($ocrResult),
                ]);
            }

            return $response;

        } catch (\Throwable $e) {
            $this->lastError = "Erreur d'extraction OCR: ".$e->getMessage();
            $this->stats['failed']++;

            Log::error("[LocalOcrService] Exception: {$e->getMessage()}", [
                'file' => $originalName ?? $filePath,
                'doc_type' => $docType,
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->createErrorResponse($this->lastError, $filePath);
        }
    }

    /**
     * Validation du fichier
     */
    private function validateFile(string $filePath, string $mimeType): array
    {
        if (! file_exists($filePath)) {
            return [
                'valid' => false,
                'error' => "Fichier introuvable: {$filePath}",
            ];
        }

        $fileSize = filesize($filePath);
        if ($fileSize > $this->config['max_file_size']) {
            return [
                'valid' => false,
                'error' => sprintf(
                    'Fichier trop volumineux: %d MB (max: %d MB)',
                    round($fileSize / 1024 / 1024, 2),
                    $this->config['max_file_size'] / 1024 / 1024
                ),
            ];
        }

        if ($fileSize === 0) {
            return [
                'valid' => false,
                'error' => 'Fichier vide',
            ];
        }

        // Vérification du mime type
        $allowedMimes = $this->config['supported_mime_types'];
        if (! in_array($mimeType, $allowedMimes)) {
            // Vérification du fichier réel
            $realMime = mime_content_type($filePath);
            if (! in_array($realMime, $allowedMimes)) {
                return [
                    'valid' => false,
                    'error' => "Type de fichier non supporté: {$mimeType} (détecté: {$realMime})",
                ];
            }
        }

        return ['valid' => true, 'error' => null];
    }

    /**
     * Génération du cache key
     */
    private function generateCacheKey(string $filePath, ?string $originalName, string $docType): string
    {
        $identifier = $originalName ?? basename($filePath);
        $modifiedTime = filemtime($filePath) ?: 0;
        $fileSize = filesize($filePath) ?: 0;

        return $this->config['cache_prefix'].md5(
            $identifier.'_'.$modifiedTime.'_'.$fileSize.'_'.$docType
        );
    }

    /**
     * Récupération depuis le cache
     */
    private function getFromCache(string $key): ?array
    {
        try {
            return Cache::get($key);
        } catch (\Throwable $e) {
            Log::warning('[LocalOcrService] Cache read failed: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Stockage dans le cache
     */
    private function storeInCache(string $key, array $data): void
    {
        try {
            Cache::put($key, $data, $this->config['cache_ttl']);
        } catch (\Throwable $e) {
            Log::warning('[LocalOcrService] Cache write failed: '.$e->getMessage());
        }
    }

    /**
     * Extraction du texte depuis le résultat
     */
    private function extractTextFromResult($ocrResult): string
    {
        if ($ocrResult instanceof OcrResult) {
            return $ocrResult->text ?? '';
        }

        if (is_array($ocrResult)) {
            return $ocrResult['raw_text'] ?? $ocrResult['text'] ?? '';
        }

        if (is_string($ocrResult)) {
            return $ocrResult;
        }

        return '';
    }

    /**
     * Nettoyage du texte extrait
     */
    private function cleanExtractedText(string $text): string
    {
        // Suppression des caractères de contrôle
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        // Correction des espaces multiples
        $text = preg_replace('/\s+/', ' ', $text);

        // Correction des sauts de ligne excessifs
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        // Suppression des espaces en début/fin de ligne
        $text = preg_replace('/^[ \t]+/m', '', $text);
        $text = preg_replace('/[ \t]+$/m', '', $text);

        // Suppression des lignes vides excessives
        $lines = array_filter(array_map('trim', explode("\n", $text)));

        return implode("\n", $lines);
    }

    /**
     * Parsing du document
     */
    private function parseDocument(string $text, string $docType): OcrResult
    {
        try {
            // Utiliser le DocumentParserManager pour le parsing
            $result = $this->parserManager->parse($docType, $text);

            // Vérifier si le parsing a réussi
            if (empty($result->fields)) {
                Log::warning("[LocalOcrService] No fields extracted for doc type: {$docType}");
            }

            return $result;
        } catch (\Throwable $e) {
            Log::error('[LocalOcrService] Parsing failed: '.$e->getMessage());

            return new OcrResult($text);
        }
    }

    /**
     * Construction de la réponse
     */
    private function buildResponse(string $text, OcrResult $parsedResult, $ocrResult, string $filePath, string $docType): array
    {
        $response = [
            'raw_text' => $text,
            'fields' => $parsedResult->fields ?? [],
            'doc_type' => $docType,
            'source_file' => basename($filePath),
            'success' => true,
            'confidence' => $this->getConfidence($parsedResult),
            'validation_passed' => $this->getValidationStatus($parsedResult),
            'validation_warnings' => $this->getValidationWarnings($parsedResult),
        ];

        // Ajout des métadonnées si disponibles
        if ($ocrResult instanceof OcrResult) {
            $response['metadata'] = $ocrResult->metadata ?? [];
            $response['engines_used'] = $ocrResult->metadata['engines_used'] ?? [];
        }

        // Ajout des métadonnées de parsing
        if ($parsedResult instanceof OcrResult) {
            $response['parsing_metadata'] = [
                'engine_used' => $parsedResult->metadata['engine_used'] ?? null,
                'confidence' => $parsedResult->metadata['confidence'] ?? null,
            ];
        }

        // Ajout des noms normalisés pour faciliter l'accès
        if (! empty($response['fields'])) {
            $response['nom'] = $response['fields']['last_name_fr'] ??
                              $response['fields']['nom'] ??
                              $response['fields']['identity_last_name_fr'] ?? '';

            $response['prenom'] = $response['fields']['first_name_fr'] ??
                                 $response['fields']['prenom'] ??
                                 $response['fields']['identity_first_name_fr'] ?? '';

            $response['cin'] = $response['fields']['cin'] ??
                              $response['fields']['numero_cin'] ??
                              $response['fields']['identity_cin'] ?? '';

            $response['cne'] = $response['fields']['cne'] ??
                              $response['fields']['identity_cne'] ?? '';
        }

        return $response;
    }

    /**
     * Création d'une réponse d'erreur
     */
    private function createErrorResponse(string $error, ?string $filePath = null): array
    {
        return [
            'raw_text' => '',
            'error' => $error,
            'success' => false,
            'source_file' => $filePath ? basename($filePath) : null,
        ];
    }

    /**
     * Création d'une réponse vide
     */
    private function createEmptyResponse(string $filePath, string $docType): array
    {
        return [
            'raw_text' => '',
            'fields' => [],
            'doc_type' => $docType,
            'source_file' => basename($filePath),
            'success' => false,
            'error' => 'No text extracted',
            'confidence' => 0,
        ];
    }

    /**
     * Récupération du niveau de confiance
     */
    private function getConfidence($result): float
    {
        if ($result instanceof OcrResult) {
            return $result->getConfidence() ?? 0.0;
        }

        if (is_array($result) && isset($result['confidence'])) {
            return (float) $result['confidence'];
        }

        return 0.0;
    }

    /**
     * Récupération du statut de validation
     */
    private function getValidationStatus($result): bool
    {
        if ($result instanceof OcrResult) {
            return $result->validationPassed() ?? false;
        }

        if (is_array($result)) {
            return $result['validation_passed'] ?? false;
        }

        return false;
    }

    /**
     * Récupération des avertissements de validation
     */
    private function getValidationWarnings($result): array
    {
        if ($result instanceof OcrResult) {
            return $result->getValidationWarnings() ?? [];
        }

        if (is_array($result)) {
            return $result['validation_warnings'] ?? [];
        }

        return [];
    }

    /**
     * Récupération des engines utilisés
     */
    private function getEnginesUsed($result): array
    {
        if ($result instanceof OcrResult) {
            $metadata = $result->metadata ?? [];

            return $metadata['engines_used'] ?? [];
        }

        return [];
    }

    /**
     * Auto-détection du type de document depuis le fichier
     */
    private function detectDocumentTypeFromFile(string $filePath): string
    {
        try {
            // Essayer de lire le début du fichier
            $handle = fopen($filePath, 'r');
            if ($handle) {
                $header = fread($handle, 4096);
                fclose($handle);

                // Détection basée sur le contenu
                if (preg_match('/\bCNIE\b|\bCIN\b|\bCARTE\s+NATIONALE\b/i', $header)) {
                    return 'cnie';
                }

                if (preg_match('/\bRELEVÉ\s+DE\s+NOTES\b|\bRELEVE\s+DES\s+NOTES\b/i', $header)) {
                    return 'releve';
                }

                if (preg_match('/\bBACCALAURÉAT\b|\bBACCALAUREAT\b|\bDIPLÔME\b/i', $header)) {
                    return 'bac';
                }

                // Détection par extension
                $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
                if ($extension === 'pdf') {
                    return 'unknown';
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[LocalOcrService] Auto-detection failed: '.$e->getMessage());
        }

        return 'unknown';
    }

    /**
     * Récupération des statistiques
     */
    public function getStats(): array
    {
        return [
            'total_processed' => $this->stats['total_processed'],
            'successful' => $this->stats['successful'],
            'failed' => $this->stats['failed'],
            'cache_hits' => $this->stats['cache_hits'],
            'unique_engines_used' => array_unique($this->stats['engines_used']),
            'config' => $this->config,
        ];
    }

    /**
     * Récupération du dernier message d'erreur
     */
    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    /**
     * Récupération des types de documents supportés
     */
    public function getSupportedDocTypes(): array
    {
        return $this->parserManager->getSupportedTypes();
    }

    /**
     * Récupération de la configuration
     */
    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Mise à jour de la configuration
     */
    public function setConfig(array $config): void
    {
        $this->config = array_merge($this->config, $config);
    }

    /**
     * Réinitialisation du service
     */
    public function reset(): void
    {
        $this->lastError = null;
        $this->stats = [
            'total_processed' => 0,
            'successful' => 0,
            'failed' => 0,
            'cache_hits' => 0,
            'engines_used' => [],
        ];
    }

    /**
     * Vérification de la disponibilité des outils OCR
     */
    public function checkAvailability(): array
    {
        $engines = [];

        // Vérification des commandes
        $commands = [
            'pdftotext' => 'PdfTextEngine',
            'pdftohtml' => 'PdfBinaryEngine',
            'tesseract' => 'TesseractEngine',
            'convert' => 'ImageMagick (pour Tesseract)',
        ];

        foreach ($commands as $command => $engine) {
            $engines[$engine] = $this->commandExists($command);
        }

        return [
            'engines_available' => $engines,
            'any_available' => in_array(true, $engines, true),
            'php_extensions' => [
                'mbstring' => extension_loaded('mbstring'),
                'gd' => extension_loaded('gd'),
                'exif' => extension_loaded('exif'),
            ],
        ];
    }

    /**
     * Vérification de l'existence d'une commande
     */
    private function commandExists(string $command): bool
    {
        $output = [];
        $returnVar = -1;
        @exec("which {$command} 2>/dev/null", $output, $returnVar);

        return $returnVar === 0;
    }

    /**
     * Nettoyage du cache
     */
    public function clearCache(): void
    {
        try {
            $pattern = $this->config['cache_prefix'].'*';
            $keys = Cache::get($pattern);

            if ($keys) {
                foreach ($keys as $key) {
                    Cache::forget($key);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[LocalOcrService] Cache clear failed: '.$e->getMessage());
        }
    }
}
