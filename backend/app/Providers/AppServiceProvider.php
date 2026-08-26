<?php

namespace App\Providers;

use App\Events\DocumentProcessed;
use App\Events\GradeDeadlineWarning;
use App\Events\OcrProcessingComplete;
use App\Listeners\HandleOcrComplete;
use App\Listeners\LogFailedLogin;
use App\Listeners\LogSuccessfulLogin;
use App\Listeners\NotifyDocumentProcessed;
use App\Models\Grade;
use App\Models\Student;
use App\Observers\GradeObserver;
use App\OCR\Engines\PdfBinaryEngine;
use App\OCR\Engines\PdfTextEngine;
use App\OCR\Engines\TesseractEngine;
use App\OCR\Parsers\BacParser;
use App\OCR\Parsers\CnieParser;
use App\OCR\Parsers\ReleveParser;
use App\Policies\GradePolicy;
use App\Policies\StudentPolicy;
use App\Services\AI\LocalOcrService;
use App\Services\Campus\CampusAlertService;
use Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
        use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Horizon\HorizonServiceProvider;
use Laravel\Octane\OctaneServiceProvider;

/**
 * Application Service Provider - Version Finale Optimisée
 *
 * Centralise l'enregistrement des services, la configuration
 * et les bindings de l'application.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Liste des services à enregistrer en tant que singletons
     */
    public array $singletons = [
        LocalOcrService::class,
    ];

    /**
     * Liste des tags pour l'injection de dépendances
     */
    private array $tags = [
        'ocr.parsers' => [
            CnieParser::class,
            BacParser::class,
            ReleveParser::class,
        ],
        'ocr.engines' => [
            PdfTextEngine::class,
            PdfBinaryEngine::class,
            TesseractEngine::class,
        ],
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // 1. Enregistrement des tags OCR
        $this->registerOcrTags();

        // 2. Binding contextuels pour LocalOcrService
        $this->registerLocalOcrService();

        // 3. Enregistrement des singletons
        $this->registerSingletons();

        // 4. Enregistrement des services en développement
        $this->registerDevelopmentServices();

        // 5. Enregistrement des services en production
        $this->registerProductionServices();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Configuration de Gate (Permissions)
        $this->bootGate();

        // 2. Configuration des modèles Eloquent
        $this->bootEloquent();

        // 3. Configuration du Rate Limiting
        $this->bootRateLimiting();

        // 4. Observers et Event Listeners
        $this->bootObserversAndListeners();

        // 5. Configuration des validations personnalisées
        $this->bootCustomValidations();

        // 6. Configuration des directives Blade
        $this->bootBladeDirectives();

        // 7. Configuration des règles de mot de passe
        $this->bootPasswordRules();

        // 8. Configuration des macros (si nécessaire)
        $this->bootMacros();

        // 9. Configuration des middlewares (si nécessaire)
        $this->bootMiddlewares();

        // 10. Configuration des commandes (si nécessaire)
        $this->bootCommands();

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }

    /**
     * Enregistrement des tags OCR
     */
    private function registerOcrTags(): void
    {
        foreach ($this->tags as $tag => $classes) {
            $this->app->tag($classes, $tag);

            if ($this->app->environment('local', 'testing')) {
                Log::debug("[AppServiceProvider] Tagged: {$tag} with ".count($classes).' classes');
            }
        }
    }

    /**
     * Enregistrement du service LocalOcrService
     */
    private function registerLocalOcrService(): void
    {
        // Binding contextuel pour les parsers
        $this->app->when(LocalOcrService::class)
            ->needs('$parsers')
            ->give(function () {
                return $this->app->tagged('ocr.parsers');
            });

        // Binding contextuel pour les engines
        $this->app->when(LocalOcrService::class)
            ->needs('$engines')
            ->give(function () {
                return $this->app->tagged('ocr.engines');
            });

        // Binding contextuel pour la configuration
        $this->app->when(LocalOcrService::class)
            ->needs('$config')
            ->give(function () {
                return config('ocr', [
                    'enable_cache' => true,
                    'cache_ttl' => 3600,
                    'enable_logging' => true,
                    'max_file_size' => 20 * 1024 * 1024,
                ]);
            });

        // Enregistrement en tant que singleton
        $this->app->singleton(LocalOcrService::class, function ($app) {
            return new LocalOcrService(
                $app->tagged('ocr.parsers'),
                $app->tagged('ocr.engines'),
                config('ocr', [])
            );
        });
    }

    /**
     * Enregistrement des singletons
     */
    private function registerSingletons(): void
    {
        foreach ($this->singletons as $singleton) {
            if (! $this->app->bound($singleton)) {
                $this->app->singleton($singleton);
            }
        }
    }

    /**
     * Enregistrement des services en développement
     */
    private function registerDevelopmentServices(): void
    {
        if (! $this->app->environment('local', 'testing')) {
            return;
        }

        // Debugbar ou Telescope en développement
        if (class_exists(\Barryvdh\Debugbar\ServiceProvider::class)) {
            $this->app->register(\Barryvdh\Debugbar\ServiceProvider::class);
        }

        // Ide-helper en développement
        if (class_exists(IdeHelperServiceProvider::class)) {
            $this->app->register(IdeHelperServiceProvider::class);
        }

        // Horizon en développement (si utilisé)
        if (class_exists(HorizonServiceProvider::class)) {
            $this->app->register(HorizonServiceProvider::class);
        }
    }

    /**
     * Enregistrement des services en production
     */
    private function registerProductionServices(): void
    {
        if (! $this->app->environment('production')) {
            return;
        }

        // Opcache en production
        if (class_exists(OctaneServiceProvider::class)) {
            $this->app->register(OctaneServiceProvider::class);
        }
    }

    /**
     * Configuration de Gate (Permissions)
     */
    private function bootGate(): void
    {
        // Super Admin : toutes les permissions
        Gate::before(function ($user, $ability) {
            if ($user->hasRole('super-admin')) {
                return true;
            }

            return null;
        });

        // Définition des permissions spécifiques
        Gate::define('manage-ocr', function ($user) {
            return $user->hasPermissionTo('manage ocr') || $user->hasRole('admin');
        });

        Gate::define('view-reports', function ($user) {
            return $user->hasPermissionTo('view reports') || $user->hasRole('admin');
        });

        Gate::define('manage-users', function ($user) {
            return $user->hasPermissionTo('manage users') || $user->hasRole('admin');
        });

        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(Grade::class, GradePolicy::class);
    }

    /**
     * Configuration des modèles Eloquent
     */
    private function bootEloquent(): void
    {
        Model::preventLazyLoading();
        Model::preventSilentlyDiscardingAttributes(! app()->isProduction());

        if (app()->isProduction()) {
            Model::handleLazyLoadingViolationUsing(function ($model, $relation) {
                Log::warning('N+1 lazy load', [
                    'model' => $model::class,
                    'relation' => $relation,
                ]);
            });
        }

        // Mass assignment remains model-level ($fillable / $guarded). Do not unguard globally.

        // Définir les événements de modèle globaux
        Model::creating(function ($model) {
            // Log de création si nécessaire
            if (method_exists($model, 'logCreation')) {
                $model->logCreation();
            }
        });

        Model::updating(function ($model) {
            // Log de mise à jour si nécessaire
            if (method_exists($model, 'logUpdate')) {
                $model->logUpdate();
            }
        });

        Model::deleting(function ($model) {
            // Log de suppression si nécessaire
            if (method_exists($model, 'logDeletion')) {
                $model->logDeletion();
            }
        });
    }

    /**
     * Configuration du Rate Limiting
     */
    private function bootRateLimiting(): void
    {
        // Rate Limiter global pour l'API
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user();
            $identifier = $user?->id ?: $request->ip();

            return Limit::perMinute(60)
                ->by($identifier)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate Limiter spécifique pour l'OCR
        RateLimiter::for('ocr', function (Request $request) {
            $user = $request->user();
            $identifier = $user?->id ?: $request->ip();

            // Limites différentes pour les utilisateurs authentifiés
            $limit = $user ? 30 : 10;

            return Limit::perMinute($limit)
                ->by($identifier)
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Limite d\'extraction OCR atteinte. Veuillez réessayer plus tard.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate Limiter pour les téléchargements
        RateLimiter::for('uploads', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de téléchargements. Veuillez réessayer plus tard.',
                        'retry_after' => $headers['Retry-After'] ?? 60,
                    ], 429);
                });
        });

        // Rate Limiter pour les authentifications
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by($request->email.'|'.$request->ip())
                ->response(function (Request $request, array $headers) {
                    return response()->json([
                        'message' => 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
                        'retry_after' => $headers['Retry-After'] ?? 300,
                    ], 429);
                });
        });
    }

    /**
     * Configuration des Observers et Event Listeners
     */
    private function bootObserversAndListeners(): void
    {
        // Observers des modèles
        Grade::observe(GradeObserver::class);

        // Event Listeners
        Event::listen(
            Login::class,
            LogSuccessfulLogin::class
        );

        // Listeners supplémentaires
        Event::listen(
            Failed::class,
            LogFailedLogin::class
        );

        Event::listen(
            GradeDeadlineWarning::class,
            function (GradeDeadlineWarning $event) {
                app(CampusAlertService::class)
                    ->notifyProfessorsGradeDeadline($event->endDate, $event->sessionLabel);
            }
        );

        // Listeners pour les événements OCR (si implémentés)
        if (class_exists(OcrProcessingComplete::class)) {
            Event::listen(
                OcrProcessingComplete::class,
                HandleOcrComplete::class
            );
        }

        // Listeners pour les événements de modèle
        if (class_exists(DocumentProcessed::class)) {
            Event::listen(
                DocumentProcessed::class,
                NotifyDocumentProcessed::class
            );
        }
    }

    /**
     * Configuration des validations personnalisées
     */
    private function bootCustomValidations(): void
    {
        // Validation : nom français
        Validator::extend('french_name', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/', $value) && strlen($value) >= 2;
        }, 'Le :attribute doit être un nom français valide.');

        // Validation : nom arabe
        Validator::extend('arabic_name', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^[\x{0600}-\x{06FF}\s\-\']+$/u', $value) && strlen($value) >= 2;
        }, 'Le :attribute doit être un nom arabe valide.');

        // Validation : CNE
        Validator::extend('cne', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^[A-Z]\d{8,9}$/', $value) === 1;
        }, 'Le :attribute doit être un CNE valide.');

        // Validation : CIN
        Validator::extend('cin', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^[A-Z]{1,2}\d{5,6}$/', $value) === 1;
        }, 'Le :attribute doit être un CIN valide.');

        // Validation : note scolaire
        Validator::extend('grade', function ($attribute, $value, $parameters, $validator) {
            return is_numeric($value) && $value >= 0 && $value <= 20;
        }, 'Le :attribute doit être une note entre 0 et 20.');

        // Validation : mention bac
        Validator::extend('bac_mention', function ($attribute, $value, $parameters, $validator) {
            $mentions = ['TRES BIEN', 'TRÈS BIEN', 'BIEN', 'ASSEZ BIEN', 'PASSABLE', 'MOYEN', 'EXCELLENT'];

            return in_array(strtoupper($value), $mentions);
        }, 'Le :attribute doit être une mention valide.');
    }

    /**
     * Configuration des directives Blade
     */
    private function bootBladeDirectives(): void
    {
        // Directive @ar pour le réagencement et la connexion des lettres arabes dans DomPDF
        Blade::directive('ar', function ($expression) {
            return "<?php echo \App\Helpers\ArabicGlyphReshaper::reshape($expression); ?>";
        });

        // Directive @production
        Blade::directive('production', function () {
            return "<?php if (app()->environment('production')): ?>";
        });

        // Directive @endproduction
        Blade::directive('endproduction', function () {
            return '<?php endif; ?>';
        });

        // Directive @development
        Blade::directive('development', function () {
            return "<?php if (app()->environment('local', 'testing')): ?>";
        });

        // Directive @enddevelopment
        Blade::directive('enddevelopment', function () {
            return '<?php endif; ?>';
        });

        // Directive @formatDate
        Blade::directive('formatDate', function ($expression) {
            return "<?php echo \Carbon\Carbon::parse($expression)->format('d/m/Y H:i'); ?>";
        });

        // Directive @formatGrade
        Blade::directive('formatGrade', function ($expression) {
            return "<?php echo number_format($expression, 2, ',', ' '); ?>";
        });
    }

    /**
     * Configuration des règles de mot de passe
     */
    private function bootPasswordRules(): void
    {
        Password::defaults(function () {
            $rule = Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols();

            if (app()->environment('production')) {
                $rule->uncompromised();
            }

            return $rule;
        });
    }

    /**
     * Configuration des macros
     */
    private function bootMacros(): void
    {
        // Macro pour les collections
        if (! Collection::hasMacro('toJsonPretty')) {
            Collection::macro('toJsonPretty', function () {
                return json_encode($this->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            });
        }

        // Macro pour les requêtes
        if (! Request::hasMacro('isBot')) {
            Request::macro('isBot', function () {
                $bots = ['googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot'];
                $userAgent = strtolower($this->userAgent() ?? '');

                foreach ($bots as $bot) {
                    if (str_contains($userAgent, $bot)) {
                        return true;
                    }
                }

                return false;
            });
        }

        // Macro pour les chaînes
        if (! Str::hasMacro('isFrenchName')) {
            Str::macro('isFrenchName', function ($value) {
                return preg_match('/^[a-zA-ZÀ-ÿ\s\-\']+$/', $value) && strlen($value) >= 2;
            });
        }
    }

    /**
     * Configuration des middlewares
     */
    private function bootMiddlewares(): void
    {
        // Ajout de middlewares personnalisés si nécessaire
        // $this->app['router']->aliasMiddleware('role', \App\Http\Middleware\CheckRole::class);
        // $this->app['router']->aliasMiddleware('permission', \App\Http\Middleware\CheckPermission::class);
    }

    /**
     * Configuration des commandes
     */
    private function bootCommands(): void
    {
        // Enregistrement des commandes personnalisées
        $this->commands([
            // \App\Console\Commands\ClearOcrCache::class,
            // \App\Console\Commands\ProcessPendingDocuments::class,
        ]);
    }

    /**
     * Obtenir la liste des classes taguées
     */
    public function getTaggedClasses(string $tag): array
    {
        return $this->tags[$tag] ?? [];
    }

    /**
     * Vérifier si un service est enregistré
     */
    public function isBound(string $abstract): bool
    {
        return $this->app->bound($abstract);
    }

    /**
     * Obtenir la configuration OCR
     */
    public function getOcrConfig(): array
    {
        return config('ocr', [
            'enable_cache' => true,
            'cache_ttl' => 3600,
            'enable_logging' => true,
            'max_file_size' => 20 * 1024 * 1024,
            'supported_mime_types' => [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/tiff',
                'image/bmp',
                'image/gif',
                'image/webp',
            ],
            'min_confidence_threshold' => 0.4,
            'enable_auto_detect' => true,
            'enable_text_cleanup' => true,
        ]);
    }
}
