<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InternalApiController extends Controller
{
    public function filiereGroups($id) { return response()->json([['id' => 1, 'name' => 'Groupe 1'], ['id' => 2, 'name' => 'Groupe 2']]); }
    
    public function groupModules($id) { return response()->json([['id' => 1, 'name' => 'Module A'], ['id' => 2, 'name' => 'Module B']]); }
    
    public function roomAvailability($id) { return response()->json(['available' => true, 'next_booking' => '14:00']); }
    
    public function examCalendar() { return response()->json([['title' => 'Examen Math', 'start' => '2023-11-20']]); }
    
    public function timetableEvents() { return response()->json([['title' => 'Cours Laravel', 'start' => '2023-10-10']]); }
    
    public function liveAttendanceStats($examId) { return response()->json(['present' => 120, 'absent' => 5, 'rate' => '96%']); }
    
    public function chatMessages($group, $module) { return response()->json([['sender' => 'Prof', 'text' => 'Bonjour à tous']]); }
    
    public function suggestMakeup(Request $request) { return response()->json(['suggested_slot' => '2023-10-15 10:00']); }
}
