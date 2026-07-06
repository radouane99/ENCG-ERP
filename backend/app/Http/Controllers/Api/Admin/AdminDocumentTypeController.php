<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentTemplate;
use App\Http\Requests\StoreDocumentTypeRequest;
use Illuminate\Http\Request;

class AdminDocumentTypeController extends Controller
{
    public function index()
    {
        $templates = DocumentTemplate::all();
        return response()->json($templates);
    }

    public function store(StoreDocumentTypeRequest $request)
    {
        $template = DocumentTemplate::create($request->validated());
        return response()->json($template, 201);
    }

    public function show($id)
    {
        $template = DocumentTemplate::findOrFail($id);
        return response()->json($template);
    }

    public function update(StoreDocumentTypeRequest $request, $id)
    {
        $template = DocumentTemplate::findOrFail($id);
        $template->update($request->validated());
        return response()->json($template);
    }

    public function destroy($id)
    {
        $template = DocumentTemplate::findOrFail($id);
        $template->delete();
        return response()->json(null, 204);
    }
}
