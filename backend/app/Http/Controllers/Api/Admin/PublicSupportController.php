<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admission\UpdatePublicSupportStatusAction;
use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use Illuminate\Http\Request;

class PublicSupportController extends Controller
{
    private function authorizeStaff(Request $request): void
    {
        abort_unless($request->user() && ($request->user()->can('system.settings') || $request->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'director'])), 403);
    }

    public function index(Request $request)
    {
        $this->authorizeStaff($request);
        $request->validate(['department' => 'nullable|in:general,technical,admissions', 'status' => 'nullable|in:new,in_progress,closed']);

        return response()->json(ContactSubmission::where('institution_id', $request->user()->institution_id)
            ->when($request->filled('department'), fn ($query) => $query->where('department', $request->department))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->status))
            ->latest('id')->paginate(20));
    }

    public function update(Request $request, int $id)
    {
        $this->authorizeStaff($request);
        $data = $request->validate(['status' => 'required|in:new,in_progress,closed']);
        app(UpdatePublicSupportStatusAction::class)->execute($request->user(), $id, $data['status']);

        return response()->json(['message' => 'Suivi mis à jour.']);
    }
}
