<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentTypeRequest;
use App\Models\DocumentTemplate;
use Illuminate\Http\JsonResponse;

class AdminDocumentTypeController extends Controller
{
    /**
     * Liste des types de documents.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => DocumentTemplate::all(),
        ]);
    }

    /**
     * Créer un type de document.
     */
    public function store(StoreDocumentTypeRequest $request): JsonResponse
    {
        $template = DocumentTemplate::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Type de document créé.',
            'data'    => $template,
        ], 201);
    }

    /**
     * Afficher un type de document.
     */
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => DocumentTemplate::findOrFail($id),
        ]);
    }

    /**
     * Mettre à jour un type de document.
     */
    public function update(StoreDocumentTypeRequest $request, int $id): JsonResponse
    {
        $template = DocumentTemplate::findOrFail($id);
        $template->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Type de document mis à jour.',
            'data'    => $template,
        ]);
    }

    /**
     * Supprimer un type de document.
     */
    public function destroy(int $id): JsonResponse
    {
        DocumentTemplate::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Type de document supprimé.',
        ]);
    }
}