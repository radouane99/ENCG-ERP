<?php

use App\Http\Controllers\Api\AdmissionAppointmentController;
use App\Http\Controllers\Api\AdmissionDeskController;
use App\Http\Controllers\Api\AdmissionEnrollmentController;
use App\Http\Controllers\Api\AdmissionOcrEvaluationController;
use App\Http\Controllers\Api\AdmissionOperationsController;
use App\Http\Controllers\Api\AdmissionWorkflowController;
use App\Http\Controllers\Api\AdmissionWorkflowPdfController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Auth\SsoController;
use App\Http\Controllers\Api\ContactController;
use App\Presentation\Api\Controllers\Auth\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:6,1');

Route::get('/login', fn () => response()->json(['message' => 'Non authentifié. Veuillez vous connecter.'], 401))->name('login');

Route::prefix('public/admissions')->middleware('throttle:10,1')->group(function () {
    Route::get('portal', [\App\Http\Controllers\Api\Admin\PublicPortalController::class, 'content']);
    Route::get('announcements/{id}/pdf', [\App\Http\Controllers\Api\Admin\PublicPortalController::class, 'attachment'])->whereUuid('id');
    Route::get('calendar', [AdmissionWorkflowController::class, 'publicCalendar']);
    Route::get('campaigns', [AdmissionWorkflowController::class, 'campaigns']);
    Route::post('admissibility', [AdmissionWorkflowController::class, 'admissibility']);
    Route::post('request-activation', [AdmissionWorkflowController::class, 'requestActivation']);
    Route::post('activate', [AdmissionWorkflowController::class, 'activate']);
});
Route::get('public/admissions/documents/{document}', [AdmissionWorkflowController::class, 'download'])->name('admissions.document');

Route::prefix('admissions/workflow')->middleware(['auth:sanctum', 'institution.context'])->group(function () {
    $workflow = AdmissionWorkflowController::class;
    $appointments = AdmissionAppointmentController::class;
    $operations = AdmissionOperationsController::class;
    Route::get('operations/context', [$operations, 'context']);
    $desk = AdmissionDeskController::class;
    Route::get('operations/desk', [$desk, 'index']);
    Route::post('operations/desk', [$desk, 'arrive']);
    Route::post('operations/desk/{ticket}', [$desk, 'transition'])->whereNumber('ticket');
    Route::get('operations/queue', [$operations, 'queue']);
    Route::put('operations/work', [$operations, 'assign'])->name('admissions.assign');
    Route::post('operations/originals', [$operations, 'original']);
    Route::get('operations/originals/{event}/receipt', [$operations, 'receipt']);
    Route::get('operations/monitor', [$operations, 'monitor']);
    Route::post('operations/ocr/{id}/retry', [$operations, 'retryOcr'])->middleware('throttle:ocr');
    Route::get('campaigns', [$workflow, 'campaigns']);
    Route::get('references', [$workflow, 'references']);
    Route::get('ocr-settings', [$workflow, 'ocrSettings']);
    Route::put('ocr-settings', [$workflow, 'ocrSettings']);
    Route::post('ocr-evaluation', [AdmissionOcrEvaluationController::class, 'evaluate'])->middleware('throttle:6,1');
    Route::post('campaigns', [$workflow, 'saveCampaign']);
    Route::put('campaigns/{id}', [$workflow, 'saveCampaign']);
    Route::get('dossier', [$workflow, 'show']);
    Route::post('dossier', [$workflow, 'save']);
    Route::post('documents', [$workflow, 'upload'])->middleware('throttle:uploads');
    Route::delete('documents', [$workflow, 'withdraw']);
    Route::post('submit', [$workflow, 'submit']);
    Route::post('ocr', [$workflow, 'startOcr'])->middleware('throttle:ocr');
    Route::get('ocr/{id}', [$workflow, 'ocrStatus']);
    Route::delete('ocr/{id}', [$workflow, 'cancelOcr']);
    Route::get('slots', [$appointments, 'slots']);
    Route::post('appointments', [$appointments, 'book']);
    Route::post('notify', [$workflow, 'notify'])->middleware('throttle:3,1');
    Route::post('notifications/{id}/retry', [$workflow, 'retryNotification'])->middleware('throttle:10,1');
    Route::get('receipt', [AdmissionWorkflowPdfController::class, 'receipt']);
    Route::get('applications', [$workflow, 'listing']);
    Route::get('stats', [$workflow, 'stats']);
    Route::post('imports/preview', [$workflow, 'previewImport']);
    Route::post('imports/{batch}/commit', [$workflow, 'commitImport']);
    Route::post('applications/{id}/activation', [$workflow, 'issueActivation'])->middleware('throttle:10,1');
    Route::post('documents/{document}/review', [$workflow, 'reviewDocument']);
    Route::get('documents/{document}/file', [$workflow, 'download']);
    Route::get('unlinked-documents', [$workflow, 'unlinkedDocuments']);
    Route::post('unlinked-documents/{document}/reconcile', [$workflow, 'reconcileDocument']);
    Route::post('decide', [$workflow, 'decide']);
    Route::get('enrollments', [AdmissionEnrollmentController::class, 'index']);
    Route::post('enrollments/dispatch', [AdmissionEnrollmentController::class, 'dispatch']);
    Route::get('enrollments/export', [AdmissionEnrollmentController::class, 'export']);
    Route::post('promote', [$workflow, 'promote']);
    Route::post('renew-invitation', [$workflow, 'renewInvitation']);
    Route::post('slots', [$appointments, 'createSlot']);
    Route::post('allocation/preview', [$appointments, 'preview']);
    Route::post('allocation/{id}/commit', [$appointments, 'commit']);
    Route::get('scan/{token}', [$appointments, 'scan']);
    Route::post('scan/{token}/check-in', [$appointments, 'checkIn']);
    Route::get('daily', [$appointments, 'daily']);
    Route::get('list-pdf', [AdmissionWorkflowPdfController::class, 'list']);
    Route::get('appointment-labels', [AdmissionWorkflowPdfController::class, 'appointmentLabels']);
});

Route::prefix('v1/auth')->group(function () {
    Route::get('/check-cne-availability', [AuthController::class, 'checkCneAvailability'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail'])->middleware('throttle:login');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('throttle:login');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::post('/two-factor/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:login');

    Route::get('/sso/providers', [SsoController::class, 'providers'])->middleware('throttle:30,1');
    Route::get('/sso/{provider}/redirect', [SsoController::class, 'redirect'])->middleware('throttle:30,1')->whereIn('provider', ['google', 'microsoft', 'oidc']);
    Route::get('/sso/{provider}/callback', [SsoController::class, 'callback'])->middleware('throttle:30,1')->whereIn('provider', ['google', 'microsoft', 'oidc']);
    Route::post('/sso/exchange', [SsoController::class, 'exchange'])->middleware('throttle:30,1');

    Route::get('/google/redirect', fn () => app(SsoController::class)->redirect('google'))->middleware('throttle:30,1');
    Route::get('/google/callback', fn (Request $request) => app(SsoController::class)->callback('google', $request))->middleware('throttle:30,1');
    Route::post('/google/exchange', [SsoController::class, 'exchange'])->middleware('throttle:30,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/sessions', [\App\Http\Controllers\Api\Auth\SessionController::class, 'index']);
        Route::delete('/sessions/others', [\App\Http\Controllers\Api\Auth\SessionController::class, 'others']);
        Route::delete('/sessions/{id}', [\App\Http\Controllers\Api\Auth\SessionController::class, 'destroy'])->whereNumber('id');
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('throttle:login');
        // 2FA management routes
        Route::post('/two-factor/setup', [AuthController::class, 'setup2FA'])->middleware('throttle:login');
        Route::post('/two-factor/confirm', [AuthController::class, 'confirm2FA'])->middleware('throttle:login');
        Route::post('/two-factor/step-up', [AuthController::class, 'stepUpTwoFactor'])->middleware('throttle:login');
        Route::delete('/two-factor/disable', [AuthController::class, 'disable2FA'])->middleware('throttle:login');
    });
});
