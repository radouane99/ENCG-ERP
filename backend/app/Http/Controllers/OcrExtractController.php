<?php

namespace App\Http\Controllers;

use App\Services\AI\LocalOcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

/**
 * OCR Extraction Controller - Version Finale Optimisée
 *
 * Gère l'extraction OCR des documents avec validation, logging,
 * support multi-formats et fallbacks
 */
class OcrExtractController extends Controller
{
    /**
     * Configuration du contrôleur
     */
    private array $config = [
        'max_file_size' => 10 * 1024 * 1024, // 10MB
        'allowed_mimes' => ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'],
        'allowed_doc_types' => ['bac', 'releve', 'cnie', 'cin', 'id_card', 'unknown'],
        'log_channel' => 'ocr',
    ];

    /**
     * Mappage des types MIME vers les extensions
     */
    private array $mimeToExtension = [
        'application/pdf' => 'pdf',
        'image/png' => 'png',
        'image/jpeg' => 'jpg',
        'image/webp' => 'webp',
        'image/tiff' => 'tiff',
        'image/bmp' => 'bmp',
    ];

    protected LocalOcrService $localOcrService;

    public function __construct(LocalOcrService $localOcrService)
    {
        $this->localOcrService = $localOcrService;
    }

    /**
     * Handle OCR extraction request for uploaded documents.
     */
    public function extract(Request $request): JsonResponse
    {
        $startTime = microtime(true);
        $requestId = $this->generateRequestId();

        // Logging de la requête
        $this->logRequest($request, $requestId);

        // 1. Validation de la requête
        $validationResult = $this->validateRequest($request);
        if (! $validationResult['valid']) {
            return $this->errorResponse(
                $validationResult['message'],
                422,
                $requestId,
                ['validation_errors' => $validationResult['errors'] ?? []]
            );
        }

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        $mimeType = $file->getMimeType() ?? $file->getClientMimeType();

        // Validation supplémentaire du fichier
        $fileValidation = $this->validateFile($file);
        if (! $fileValidation['valid']) {
            return $this->errorResponse(
                $fileValidation['message'],
                422,
                $requestId,
                ['file_error' => $fileValidation['error']]
            );
        }

        // 2. Détermination du type de document
        $docType = $this->determineDocumentType($request, $originalName);

        // 3. Vérification des outils OCR disponibles
        $availability = $this->localOcrService->checkAvailability();
        if (! $availability['any_available']) {
            Log::error("[OCR-{$requestId}] Aucun outil OCR disponible sur le serveur", [
                'engines' => $availability['engines_available'],
            ]);

            return $this->errorResponse(
                'Le service OCR n\'est pas disponible. Veuillez contacter l\'administrateur.',
                503,
                $requestId
            );
        }

        // 4. Vérification du cache (optionnelle)
        $cacheKey = $this->generateCacheKey($file, $docType);
        $cachedResult = $this->getCachedResult($cacheKey);
        if ($cachedResult) {
            Log::info("[OCR-{$requestId}] Cache hit pour: {$originalName}");

            return $this->successResponse(
                $cachedResult,
                $requestId,
                true // from_cache
            );
        }

        $tempPath = $file->getRealPath();

        try {
            // 5. Exécution de l'OCR
            $ocrResult = $this->localOcrService->extractDocumentOcr(
                $tempPath,
                $mimeType,
                $originalName,
                $docType
            );

            // Extraction du texte
            $rawText = $this->extractRawText($ocrResult);

            // 6. Vérification du résultat
            if (empty(trim($rawText))) {
                $lastError = $this->localOcrService->getLastError() ??
                            "Impossible d'extraire le texte du document. Le fichier est peut-être illisible ou mal numérisé.";

                $this->logFailedExtraction($requestId, $originalName, $docType, $mimeType, $lastError);

                return $this->errorResponse(
                    $lastError,
                    422,
                    $requestId,
                    [
                        'ocr_data' => ['raw_text' => ''],
                        'doc_type' => $docType,
                    ]
                );
            }

            // 7. Formatage du résultat
            $responseData = $this->formatResponseData($ocrResult, $rawText, $docType);

            // 8. Mise en cache du résultat
            $this->cacheResult($cacheKey, $responseData);

            // 9. Logging du succès
            $duration = round(microtime(true) - $startTime, 3);
            $this->logSuccessfulExtraction($requestId, $originalName, $docType, $duration, $responseData);

            // 10. Retour du résultat
            return $this->successResponse(
                $responseData,
                $requestId,
                false,
                [
                    'duration' => $duration,
                    'file_size' => $fileSize,
                    'doc_type' => $docType,
                ]
            );

        } catch (Throwable $e) {
            $this->logCriticalError($requestId, $originalName, $e);

            return $this->errorResponse(
                'Une erreur interne est survenue lors du traitement OCR.',
                500,
                $requestId,
                [
                    'error' => config('app.debug') ? $e->getMessage() : null,
                    'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                ]
            );
        }
    }

    /**
     * Valider la requête
     */
    private function validateRequest(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'file',
                'mimes:'.implode(',', $this->config['allowed_mimes']),
                'max:'.($this->config['max_file_size'] / 1024), // KB
            ],
            'doc_type' => 'nullable|string|in:'.implode(',', $this->config['allowed_doc_types']),
            'options' => 'nullable|array',
            'options.cache' => 'nullable|boolean',
            'options.cleanup' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return [
                'valid' => false,
                'message' => 'Données de requête invalides',
                'errors' => $validator->errors()->toArray(),
            ];
        }

        return ['valid' => true];
    }

    /**
     * Valider le fichier
     */
    private function validateFile($file): array
    {
        // Vérifier que le fichier est valide
        if (! $file->isValid()) {
            return [
                'valid' => false,
                'message' => 'Le fichier téléchargé est invalide ou corrompu.',
                'error' => $file->getError(),
            ];
        }

        // Vérifier la taille
        if ($file->getSize() > $this->config['max_file_size']) {
            return [
                'valid' => false,
                'message' => sprintf(
                    'Le fichier est trop volumineux. Taille maximale: %d MB',
                    $this->config['max_file_size'] / 1024 / 1024
                ),
                'error' => 'max_size_exceeded',
            ];
        }

        // Vérifier le type MIME réel
        $realMime = mime_content_type($file->getRealPath());
        if ($realMime && ! in_array($realMime, array_keys($this->mimeToExtension))) {
            return [
                'valid' => false,
                'message' => 'Type de fichier non supporté: '.$realMime,
                'error' => 'unsupported_mime_type',
            ];
        }

        return ['valid' => true];
    }

    /**
     * Déterminer le type de document
     */
    private function determineDocumentType(Request $request, string $originalName): string
    {
        $docType = $request->input('doc_type');

        // Si le type est fourni et valide, l'utiliser
        if (! empty($docType) && in_array($docType, $this->config['allowed_doc_types'])) {
            return strtolower($docType);
        }

        // Auto-détection à partir du nom de fichier
        $lowerName = strtolower($originalName);
        $patterns = [
            'cnie' => ['cin', 'cnie', 'carte', 'identité', 'id_card', 'cni'],
            'releve' => ['releve', 'notes', 'transcript', 'bulletin', 'notes'],
            'bac' => ['bac', 'baccalaureat', 'diplome', 'attestation', 'baccalauréat'],
        ];

        foreach ($patterns as $type => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($lowerName, $keyword)) {
                    return $type;
                }
            }
        }

        return 'unknown';
    }

    /**
     * Extraire le texte brut du résultat
     */
    private function extractRawText($ocrResult): string
    {
        if (is_array($ocrResult)) {
            return $ocrResult['raw_text'] ?? $ocrResult['text'] ?? '';
        }

        if (method_exists($ocrResult, 'getText')) {
            return $ocrResult->getText();
        }

        if (property_exists($ocrResult, 'text')) {
            return $ocrResult->text;
        }

        if (property_exists($ocrResult, 'rawText')) {
            return $ocrResult->rawText;
        }

        return '';
    }

    /**
     * Formater les données de réponse
     */
    private function formatResponseData($ocrResult, string $rawText, string $docType): array
    {
        $fields = [];
        $metadata = [];

        if (is_array($ocrResult)) {
            $fields = $ocrResult['fields'] ?? [];
            $metadata = $ocrResult['metadata'] ?? [];
        } elseif (method_exists($ocrResult, 'getFields')) {
            $fields = $ocrResult->getFields();
            $metadata = $ocrResult->getMetadata() ?? [];
        } elseif (property_exists($ocrResult, 'fields')) {
            $fields = $ocrResult->fields ?? [];
        }

        // Normalisation des champs pour faciliter l'accès
        $normalized = $this->normalizeFields($fields);

        return array_merge([
            'raw_text' => $rawText,
            'fields' => $fields,
            'normalized' => $normalized,
            'doc_type' => $docType,
            'success' => true,
        ], $metadata);
    }

    /**
     * Normaliser les champs extraits
     */
    private function normalizeFields(array $fields): array
    {
        $normalized = [];

        // Mappage des champs
        $mapping = [
            'nom' => ['last_name_fr', 'nom', 'identity_last_name_fr', 'last_name'],
            'prenom' => ['first_name_fr', 'prenom', 'identity_first_name_fr', 'first_name'],
            'cin' => ['cin', 'numero_cin', 'identity_cin', 'cnie'],
            'cne' => ['cne', 'identity_cne', 'massar'],
            'date_naissance' => ['birth_date', 'date_naissance', 'birthday'],
            'lieu_naissance' => ['birth_city_fr', 'lieu_naissance', 'birth_place'],
            'bac_type' => ['bac_type', 'filiere', 'serie'],
            'mention' => ['mention', 'mention_bac'],
            'moyenne' => ['moyenne_bac', 'moyenne', 'average'],
            'academy' => ['academy', 'academie', 'aref'],
            'high_school' => ['high_school', 'lycee', 'etablissement'],
            'bac_year' => ['bac_year', 'annee_bac', 'year'],
            'session' => ['session'],
            'sexe' => ['gender', 'sexe'],
            'address' => ['address_fr', 'address', 'adresse'],
        ];

        foreach ($mapping as $target => $sources) {
            foreach ($sources as $source) {
                if (! empty($fields[$source])) {
                    $normalized[$target] = $fields[$source];
                    break;
                }
            }
        }

        // Ajout des champs supplémentaires
        foreach ($fields as $key => $value) {
            if (! str_starts_with($key, '_') && ! isset($normalized[$key])) {
                $normalized[$key] = $value;
            }
        }

        return $normalized;
    }

    /**
     * Génération d'un ID de requête unique
     */
    private function generateRequestId(): string
    {
        return uniqid('ocr_', true).'_'.substr(md5(microtime()), 0, 8);
    }

    /**
     * Génération de la clé de cache
     */
    private function generateCacheKey($file, string $docType): string
    {
        $hash = md5(
            $file->getClientOriginalName().
            $file->getSize().
            $file->getMimeType().
            $docType
        );

        return 'ocr_result_'.$hash;
    }

    /**
     * Récupération du résultat en cache
     */
    private function getCachedResult(string $key): ?array
    {
        try {
            if (config('cache.default') !== 'file' && config('cache.default') !== 'database') {
                return null;
            }
            $cached = cache()->get($key);

            return $cached && ! empty($cached['raw_text']) ? $cached : null;
        } catch (Throwable $e) {
            Log::warning('Cache read failed: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Mise en cache du résultat
     */
    private function cacheResult(string $key, array $data): void
    {
        try {
            if (config('cache.default') !== 'file' && config('cache.default') !== 'database') {
                return;
            }
            cache()->put($key, $data, now()->addHours(24));
        } catch (Throwable $e) {
            Log::warning('Cache write failed: '.$e->getMessage());
        }
    }

    /**
     * Logging de la requête
     */
    private function logRequest(Request $request, string $requestId): void
    {
        Log::channel($this->config['log_channel'])->info('--- OCR Extraction Triggered ---', [
            'request_id' => $requestId,
            'file' => $request->file('file')?->getClientOriginalName(),
            'doc_type' => $request->input('doc_type'),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Logging d'extraction réussie
     */
    private function logSuccessfulExtraction(
        string $requestId,
        string $fileName,
        string $docType,
        float $duration,
        array $responseData
    ): void {
        $normalized = $responseData['normalized'] ?? [];

        Log::channel($this->config['log_channel'])->info('OCR Extraction successful', [
            'request_id' => $requestId,
            'file' => $fileName,
            'doc_type' => $docType,
            'duration' => $duration.'s',
            'text_length' => strlen($responseData['raw_text'] ?? ''),
            'extracted_fields' => array_keys($responseData['fields'] ?? []),
            'has_nom' => ! empty($normalized['nom']),
            'has_prenom' => ! empty($normalized['prenom']),
            'has_cin' => ! empty($normalized['cin']),
            'has_cne' => ! empty($normalized['cne']),
        ]);
    }

    /**
     * Logging d'échec d'extraction
     */
    private function logFailedExtraction(
        string $requestId,
        string $fileName,
        string $docType,
        string $mimeType,
        string $error
    ): void {
        Log::channel($this->config['log_channel'])->warning('OCR Extraction failed', [
            'request_id' => $requestId,
            'file' => $fileName,
            'doc_type' => $docType,
            'mime_type' => $mimeType,
            'error' => $error,
            'last_error' => $this->localOcrService->getLastError(),
        ]);
    }

    /**
     * Logging d'erreur critique
     */
    private function logCriticalError(string $requestId, string $fileName, Throwable $e): void
    {
        Log::channel($this->config['log_channel'])->error('OCR Extraction Exception', [
            'request_id' => $requestId,
            'file' => $fileName,
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null,
        ]);
    }

    /**
     * Réponse de succès
     */
    private function successResponse(
        array $data,
        string $requestId,
        bool $fromCache = false,
        array $extra = []
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'is_realtime' => true,
            'request_id' => $requestId,
            'from_cache' => $fromCache,
            'message' => 'Extraction réussie !',
            'ocr_data' => $data,
            'metadata' => array_merge([
                'timestamp' => now()->toIso8601String(),
                'version' => '2.0',
            ], $extra),
        ], 200);
    }

    /**
     * Réponse d'erreur
     */
    private function errorResponse(
        string $message,
        int $statusCode,
        string $requestId,
        array $extra = []
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'is_realtime' => false,
            'request_id' => $requestId,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ] + $extra, $statusCode);
    }

    /**
     * Vérification de l'état du service OCR
     */
    public function health(Request $request): JsonResponse
    {
        $availability = $this->localOcrService->checkAvailability();
        $stats = $this->localOcrService->getStats();

        return response()->json([
            'status' => $availability['any_available'] ? 'healthy' : 'degraded',
            'engines' => $availability['engines_available'],
            'stats' => $stats,
            'supported_doc_types' => $this->config['allowed_doc_types'],
            'supported_mimes' => $this->config['allowed_mimes'],
            'max_file_size' => $this->config['max_file_size'],
            'version' => '2.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Nettoyage du cache OCR
     */
    public function clearCache(Request $request): JsonResponse
    {
        // Vérification des permissions (admin uniquement)
        if (! $this->isAdmin($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé',
            ], 403);
        }

        try {
            $this->localOcrService->clearCache();

            return response()->json([
                'success' => true,
                'message' => 'Cache OCR nettoyé avec succès',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du nettoyage du cache: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Vérification des droits admin (simplifiée)
     */
    private function isAdmin(Request $request): bool
    {
        // À adapter selon votre système d'authentification
        return $request->user()?->hasRole('admin') ?? false;
    }

    /**
     * Traitement batch de documents
     */
    public function batchExtract(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'files' => 'required|array|max:10',
            'files.*' => 'file|mimes:'.implode(',', $this->config['allowed_mimes']).'|max:'.($this->config['max_file_size'] / 1024),
            'doc_type' => 'nullable|string|in:'.implode(',', $this->config['allowed_doc_types']),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données de requête invalides',
                'errors' => $validator->errors()->toArray(),
            ], 422);
        }

        $docType = $request->input('doc_type', 'unknown');
        $results = [];
        $errors = [];

        foreach ($request->file('files') as $file) {
            try {
                $result = $this->localOcrService->extractDocumentOcr(
                    $file->getRealPath(),
                    $file->getMimeType(),
                    $file->getClientOriginalName(),
                    $docType
                );

                $rawText = $this->extractRawText($result);

                if (empty(trim($rawText))) {
                    $errors[] = [
                        'file' => $file->getClientOriginalName(),
                        'error' => 'Aucun texte extrait',
                    ];
                } else {
                    $results[] = [
                        'file' => $file->getClientOriginalName(),
                        'data' => $this->formatResponseData($result, $rawText, $docType),
                    ];
                }
            } catch (Throwable $e) {
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'total' => count($request->file('files')),
            'processed' => count($results),
            'failed' => count($errors),
            'results' => $results,
            'errors' => $errors,
        ]);
    }
}
