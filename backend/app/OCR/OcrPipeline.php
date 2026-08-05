<?php

namespace App\OCR;

use App\OCR\Contracts\OcrEngineInterface;
use App\OCR\Contracts\OcrPipelineInterface;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * OCR Pipeline - Version Ultra Rapide
 * Optimisé pour la vitesse avec fallback intelligent
 */
class OcrPipeline implements OcrPipelineInterface
{
    private array $engines = [];
    private array $config;
    private array $processedEngines = [];
    private array $performanceMetrics = [];

    public function __construct(array $config = [])
    {
        $this->config = array_merge([
            'stop_on_first_success' => true,
            'min_confidence' => 0.3, // Réduit pour être plus permissif
            'max_engines_to_try' => 2, // Limite le nombre d'engines testés
            'timeout_per_engine' => 10, // Timeout en secondes
            'log_engine_performance' => false, // Désactivé pour la vitesse
            'enable_parallel_processing' => false, // Désactivé par défaut
            'early_stop_on_keywords' => true, // Arrêt précoce si mots-clés trouvés
        ], $config);
    }

    public function registerEngine(OcrEngineInterface $engine): void
    {
        $this->engines[] = $engine;
    }

    public function process(string $filePath, string $docType = ''): OcrResult
    {
        $this->processedEngines = [];
        $this->performanceMetrics = [];
        $startTime = microtime(true);

        // 1. Vérification rapide du fichier
        if (!file_exists($filePath) || filesize($filePath) === 0) {
            return new OcrResult('');
        }

        // 2. Tri des engines par priorité
        $sortedEngines = $this->sortEnginesByPriority($this->engines);
        
        // 3. Limiter le nombre d'engines à tester
        $enginesToTry = array_slice($sortedEngines, 0, $this->config['max_engines_to_try']);

        $bestResult = null;
        $bestConfidence = 0;
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';

        // 4. Détection rapide du type de document pour optimiser
        $docType = $this->quickDetectDocType($filePath, $docType);

        foreach ($enginesToTry as $engine) {
            if (!$this->shouldUseEngine($engine, $filePath, $docType)) {
                continue;
            }

            try {
                $engineStartTime = microtime(true);
                
                // Exécution avec timeout
                $result = $this->executeWithTimeout(
                    fn() => $engine->extract($filePath, $mimeType, $docType),
                    $this->config['timeout_per_engine']
                );

                $duration = microtime(true) - $engineStartTime;
                
                $this->performanceMetrics[] = [
                    'engine' => get_class($engine),
                    'duration' => $duration,
                    'text_length' => strlen($result->text ?? ''),
                ];

                // Vérification rapide si le résultat est valide
                if ($this->isResultValid($result)) {
                    $confidence = $this->quickConfidence($result);
                    
                    if ($confidence > $bestConfidence) {
                        $bestConfidence = $confidence;
                        $bestResult = $result;
                    }

                    // Arrêt précoce si résultat de bonne qualité
                    if ($confidence >= $this->config['min_confidence']) {
                        $bestResult->setParsedField('_engine_used', get_class($engine));
                        $bestResult->setParsedField('_confidence', $confidence);
                        break;
                    }
                }

            } catch (Throwable $e) {
                // Erreur silencieuse pour la vitesse
                continue;
            }
        }

        // 5. Si aucun résultat, utiliser le premier engine qui fonctionne
        if (!$bestResult) {
            $bestResult = $this->emergencyExtract($filePath, $mimeType, $docType);
        }

        // 6. Ajout des métadonnées
        $totalDuration = microtime(true) - $startTime;
        if ($bestResult) {
            $bestResult->setParsedField('_processing_time', round($totalDuration, 3));
            $bestResult->setParsedField('_engines_tried', count($this->processedEngines));
        }

        return $bestResult ?? new OcrResult('');
    }

    /**
     * Exécution avec timeout
     */
    private function executeWithTimeout(callable $callback, int $timeout)
    {
        if (!function_exists('pcntl_fork')) {
            // Fallback si pcntl n'est pas disponible
            return $callback();
        }

        $pid = pcntl_fork();
        
        if ($pid === -1) {
            return $callback();
        }
        
        if ($pid === 0) {
            // Processus enfant
            try {
                $result = $callback();
                exit(serialize($result));
            } catch (Throwable $e) {
                exit(serialize(null));
            }
        }
        
        // Processus parent
        $status = 0;
        $start = time();
        
        while (time() - $start < $timeout) {
            if (pcntl_waitpid($pid, $status, WNOHANG) > 0) {
                break;
            }
            usleep(10000); // 10ms
        }
        
        if (!pcntl_waitpid($pid, $status, WNOHANG)) {
            posix_kill($pid, SIGKILL);
            throw new \RuntimeException("Engine timeout after {$timeout}s");
        }
        
        $result = pcntl_wexitstatus($status);
        if ($result !== 0) {
            throw new \RuntimeException("Engine failed with code: {$result}");
        }
        
        return null;
    }

    /**
     * Vérification rapide si le résultat est valide
     */
    private function isResultValid(OcrResult $result): bool
    {
        if (empty($result->text)) {
            return false;
        }

        $text = trim($result->text);
        
        // Trop court = invalide
        if (strlen($text) < 20) {
            return false;
        }

        // Vérification rapide des caractères
        $alphaCount = preg_match_all('/[a-zA-Z\x{0600}-\x{06FF}]/u', $text);
        if ($alphaCount < 10) {
            return false;
        }

        return true;
    }

    /**
     * Confiance rapide (pas de calcul lourd)
     */
    private function quickConfidence(OcrResult $result): float
    {
        $text = $result->text;
        $confidence = 0.3; // Score de base

        // Bonus pour la longueur
        $length = strlen($text);
        if ($length > 1000) $confidence += 0.3;
        else if ($length > 500) $confidence += 0.2;
        else if ($length > 100) $confidence += 0.1;

        // Bonus pour les patterns utiles
        $patterns = [
            '/[A-Z]{1,2}\d{5,6}/', // CIN
            '/[A-Z]\d{9}/',        // CNE
            '/\d{1,2}\.\d{2}/',    // Notes
            '/\d{2}\/\d{2}\/\d{4}/', // Dates
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                $confidence += 0.1;
            }
        }

        // Bonus pour les mots-clés spécifiques au document
        $keywords = ['NOM', 'PRENOM', 'CIN', 'CNE', 'BACCALAUREAT', 'RELEVE', 'MOYENNE'];
        foreach ($keywords as $keyword) {
            if (stripos($text, $keyword) !== false) {
                $confidence += 0.05;
            }
        }

        return min($confidence, 1.0);
    }

    /**
     * Détection rapide du type de document
     */
    private function quickDetectDocType(string $filePath, string $docType): string
    {
        if (!empty($docType) && $docType !== 'unknown') {
            return $docType;
        }

        // Détection par extension
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        
        $extToType = [
            'pdf' => 'unknown',
            'png' => 'unknown',
            'jpg' => 'unknown',
            'jpeg' => 'unknown',
            'webp' => 'unknown',
        ];

        return $extToType[$extension] ?? 'unknown';
    }

    /**
     * Extraction d'urgence (dernier recours)
     */
    private function emergencyExtract(string $filePath, string $mimeType, string $docType): ?OcrResult
    {
        // Essayer tous les engines en séquence rapide
        foreach ($this->engines as $engine) {
            try {
                $result = $engine->extract($filePath, $mimeType, $docType);
                if (!empty($result->text) && strlen(trim($result->text)) > 50) {
                    return $result;
                }
            } catch (Throwable $e) {
                continue;
            }
        }

        return null;
    }

    private function sortEnginesByPriority(array $engines): array
    {
        usort($engines, function ($a, $b) {
            return $a->getPriority() <=> $b->getPriority();
        });
        return $engines;
    }

    private function shouldUseEngine(OcrEngineInterface $engine, string $filePath, string $docType): bool
    {
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        return $engine->supports($mimeType, $filePath, $docType);
    }

    public function getProcessedEngines(): array
    {
        return $this->processedEngines;
    }

    public function getPerformanceMetrics(): array
    {
        return $this->performanceMetrics;
    }

    public function getStats(): array
    {
        return [
            'total_engines' => count($this->engines),
            'config' => $this->config,
            'performance_metrics' => $this->performanceMetrics,
        ];
    }
}