<?php

namespace App\Exceptions;

use Exception;

class OptimisticLockException extends Exception
{
    /**
     * Render the exception as an HTTP response.
     */
    public function render($request)
    {
        return response()->json([
            'message' => 'The resource was modified by another user. Please refresh and try again.',
            'error' => 'Conflict'
        ], 409);
    }
}
