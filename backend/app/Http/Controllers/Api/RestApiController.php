<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RestApiController extends Controller
{
    public function modules(Request $request) { return response()->json([['id' => 1, 'name' => 'Bases de Données Avancées', 'credits' => 3]]); }
    
    public function grades(Request $request) { 
        return response()->json([[
            'module' => 'Bases de Données Avancées',
            'cc' => 14.5,
            'exam' => 12.0,
            'average' => 13.25,
            'status' => 'validé',
            'credits' => 3
        ]]); 
    }
    
    public function schedule(Request $request) { return response()->json([['day' => 'Lundi', 'time' => '08:00', 'module' => 'Algorithmique']]); }
    
    public function absences(Request $request) { return response()->json([['date' => '2023-10-12', 'module' => 'Management', 'justified' => false]]); }
    
    public function exams(Request $request) { return response()->json([['module' => 'Comptabilité', 'date' => '2023-11-20', 'room' => 'Amphi A']]); }
    
    public function appointments(Request $request) { return response()->json([]); }
    
    public function notifications(Request $request) { return response()->json([['id' => 1, 'title' => 'Nouvelle note', 'read' => false]]); }
    
    public function readNotification($id) { return response()->json(['success' => true]); }
    
    public function readAllNotifications() { return response()->json(['success' => true]); }
}
