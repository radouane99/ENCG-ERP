<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Internship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class InternshipConversationController extends Controller
{
    public function index(Request $request, int $id) {
        $stage = Internship::with('student')->findOrFail($id); $this->authorize('view', $stage);
        $rows = DB::table('internship_messages as m')->join('users as u', 'u.id', '=', 'm.user_id')->where('internship_id', $id)->orderByDesc('m.id')->limit(100)->get(['m.id', 'm.user_id', 'm.body', 'm.created_at', 'u.name'])->reverse()->values()->map(fn ($row) => ['id' => $row->id, 'author' => $row->name, 'text' => $row->body, 'date' => $row->created_at, 'isProf' => (int) $row->user_id !== (int) $stage->student->user_id]);
        return response()->json(['data' => $rows]);
    }
    public function store(Request $request, int $id) {
        $stage = Internship::with('student')->findOrFail($id); $this->authorize('view', $stage);
        $data = $request->validate(['body' => 'required|string|min:2|max:4000']);
        DB::table('internship_messages')->insert(['internship_id' => $id, 'user_id' => $request->user()->id, 'body' => $data['body'], 'created_at' => now(), 'updated_at' => now()]);
        activity()->causedBy($request->user())->performedOn($stage)->log('internship_message_recorded');
        return response()->json(['success' => true, 'message' => 'Message enregistré dans le suivi du stage.'], 201);
    }
}