<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Api\Auth\SessionController;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireStepUpAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        if (! SessionController::hasActiveSudoMode($user, $request)) {
            return response()->json([
                'success' => false,
                'code' => 'SUDO_REQUIRED',
                'message' => 'Cette opération critique exige une re-vérification d\'identité (Mode Sudo 10 minutes).',
            ], 423);
        }

        return $next($request);
    }
}
