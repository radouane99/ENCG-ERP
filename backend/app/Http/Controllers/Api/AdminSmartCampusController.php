<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminSmartCampusController extends Controller
{
    public function getCampusData()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'energy' => '450 kWh',
                'occupants' => 1240,
                'rooms' => [
                    ['id' => 1, 'name' => 'Amphi Al Khwarizmi', 'type' => 'Amphi', 'occupancy' => '85%', 'status' => 'occupy', 'temp' => '22°C', 'energy' => 'High'],
                    ['id' => 2, 'name' => 'Amphi Ibn Sina', 'type' => 'Amphi', 'occupancy' => '0%', 'status' => 'empty', 'temp' => '19°C', 'energy' => 'Low'],
                    ['id' => 3, 'name' => 'Labo Informatique 3', 'type' => 'Lab', 'occupancy' => '100%', 'status' => 'occupy', 'temp' => '24°C', 'energy' => 'High', 'alert' => 'Projecteur défectueux'],
                    ['id' => 4, 'name' => 'Salle B12', 'type' => 'TD', 'occupancy' => '40%', 'status' => 'occupy', 'temp' => '21°C', 'energy' => 'Medium'],
                    ['id' => 5, 'name' => 'Bibliothèque Centrale', 'type' => 'Commun', 'occupancy' => '60%', 'status' => 'occupy', 'temp' => '20°C', 'energy' => 'Medium'],
                ]
            ]
        ]);
    }
}
