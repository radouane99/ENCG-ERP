<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MobilityPartner;
use Illuminate\Http\Request;

class MobilityPartnerController extends Controller
{
    private function authorizeStaff(Request $request): void
    {
        abort_unless($request->user()->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'pedagogy_officer']), 403);
    }

    public function index(Request $request)
    {
        $this->authorizeStaff($request);

        return response()->json(['data' => MobilityPartner::where(fn ($q) => $q->where('institution_id', $request->user()->institution_id)->orWhereNull('institution_id'))->orderBy('name')->get()]);
    }

    private function validated(Request $request): array
    {
        return $request->validate(['name' => 'required|string|max:255', 'country' => 'required|string|max:255', 'city' => 'nullable|string|max:255', 'program_type' => 'required|in:exchange,double_degree,erasmus', 'slots' => 'required|integer|min:0|max:10000', 'gpa_required' => 'required|numeric|min:0|max:20', 'is_active' => 'required|boolean']);
    }

    public function store(Request $request)
    {
        $this->authorizeStaff($request);
        $partner = MobilityPartner::create($this->validated($request) + ['institution_id' => $request->user()->institution_id]);
        activity()->causedBy($request->user())->performedOn($partner)->log('mobility_partner_created');

        return response()->json(['data' => $partner], 201);
    }

    public function update(Request $request, int $id)
    {
        $this->authorizeStaff($request);
        $partner = MobilityPartner::whereKey($id)->where(fn ($q) => $q->where('institution_id', $request->user()->institution_id)->when($request->user()->hasRole('super-admin'), fn ($q) => $q->orWhereNull('institution_id')))->firstOrFail();
        $partner->update($this->validated($request));
        activity()->causedBy($request->user())->performedOn($partner)->log('mobility_partner_updated');

        return response()->json(['data' => $partner]);
    }
}
