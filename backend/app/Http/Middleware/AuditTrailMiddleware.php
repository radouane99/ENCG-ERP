<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditTrailMiddleware
{
    /**
     * Paths excluded from noisy audit logging.
     */
    protected array $excludedPaths = [
        'api/v1/admin/activity-logs',
        'api/activity-logs',
        'api/v1/notifications',
        'api/notifications',
        'up',
        'sanctum/csrf-cookie',
    ];

    /**
     * Handle an incoming request and log its mutation.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log mutating actions (POST, PUT, PATCH, DELETE) and sensitive exports
        $method = $request->method();
        $isMutating = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']);
        $isSensitiveGet = $method === 'GET' && (
            str_contains($request->path(), 'export') ||
            str_contains($request->path(), 'pv-pdf') ||
            str_contains($request->path(), 'download')
        );

        if (! $isMutating && ! $isSensitiveGet) {
            return $response;
        }

        // Check if path is excluded
        foreach ($this->excludedPaths as $excluded) {
            if (str_contains($request->path(), $excluded)) {
                return $response;
            }
        }

        try {
            $user = $request->user() ?? Auth::user();

            // Clean sensitive parameters
            $payload = $request->except([
                'password',
                'password_confirmation',
                'token',
                'current_password',
                '_token',
                'secret',
            ]);

            // Determine Action Type & Severity
            $path = $request->path();
            $actionType = 'DATA_MUTATION';
            $severity = 'info';
            $actionName = "{$method} /{$path}";

            if (str_contains($path, 'login') || str_contains($path, 'auth')) {
                $actionType = 'AUTHENTICATION';
                $actionName = 'Authentification Utilisateur';
                $severity = 'success';
            } elseif (str_contains($path, 'grade') || str_contains($path, 'note')) {
                $actionType = 'GRADE_MUTATION';
                $actionName = 'Modification / Saisie de Notes';
                $severity = 'warning';
            } elseif (str_contains($path, 'deliberat') || str_contains($path, 'apogee')) {
                $actionType = 'APOGEE_OVERRIDE';
                $actionName = 'Délibération / Export APOGEE';
                $severity = 'warning';
            } elseif (str_contains($path, 'document') || str_contains($path, 'request') || str_contains($path, 'attestation')) {
                $actionType = 'DOCUMENT_REQUEST';
                $actionName = 'Guichet Documentaire';
                $severity = 'info';
            } elseif (str_contains($path, 'finance') || str_contains($path, 'payment')) {
                $actionType = 'FINANCE_TRANSACTION';
                $actionName = 'Transaction Financière Régie';
                $severity = 'success';
            } elseif (str_contains($path, 'user') || str_contains($path, 'role') || str_contains($path, 'permission')) {
                $actionType = 'SECURITY_AUDIT';
                $actionName = 'Gestion des Utilisateurs & Rôles';
                $severity = 'warning';
            }

            $userName = $user ? ($user->name ?? trim(($user->first_name ?? '').' '.($user->last_name ?? ''))) : 'Visiteur / Anonyme';
            $userEmail = $user?->email;
            $userRole = $user?->role ?? ($user?->roles?->first()?->name ?? 'Invité');

            $description = "Exécution de {$actionName} par {$userName} ({$userRole}) depuis l'adresse IP {$request->ip()} [Statut HTTP {$response->getStatusCode()}]";

            if (class_exists(AuditLog::class)) {
                AuditLog::record([
                    'user_id' => $user?->id,
                    'user_name' => $userName ?: 'Utilisateur',
                    'user_email' => $userEmail,
                    'user_role' => $userRole,
                    'action' => $actionName,
                    'action_type' => $actionType,
                    'description' => $description,
                    'method' => $method,
                    'url' => $request->fullUrl(),
                    'ip_address' => $request->ip() ?: '127.0.0.1',
                    'user_agent' => substr($request->userAgent() ?? '', 0, 500),
                    'payload' => ! empty($payload) ? $payload : null,
                    'response_status' => $response->getStatusCode(),
                    'severity' => $response->getStatusCode() >= 400 ? 'error' : $severity,
                ]);
            }
        } catch (\Throwable $e) {
            // Silently fail to avoid breaking user operations
            Log::warning('AuditTrailMiddleware failed: '.$e->getMessage());
        }

        return $response;
    }
}
