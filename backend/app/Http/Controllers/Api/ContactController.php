<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ContactSubmission;

class ContactController extends Controller
{
    public function send(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        try {
            ContactSubmission::create($validated);
            return response()->json(['success' => true, 'message' => 'Message saved successfully.']);
        } catch (\Exception $e) {
            \Log::error('Error saving contact message: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to save message.'], 500);
        }
    }
}
