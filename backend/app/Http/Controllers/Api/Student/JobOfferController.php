<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class JobOfferController extends Controller
{
    public function index(Request $request)
    {
        $offers = \App\Models\JobOffer::latest()->get();
        return response()->json(['data' => $offers]);
    }
}
