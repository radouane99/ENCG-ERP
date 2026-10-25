<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\EvaluateOcrAnnotationsAction;
use App\Http\Controllers\Controller;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;

class AdmissionOcrEvaluationController extends Controller
{
    public function evaluate(Request $request, EvaluateOcrAnnotationsAction $action)
    {
        AdmissionAccess::review($request);
        $request->validate(['file' => 'required|file|max:2048|extensions:json', 'authorized_use' => 'required|accepted']);

        return response()->json(['data' => $action->execute($request->file('file'))]);
    }
}
