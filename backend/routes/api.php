<?php

// Routes are now modularized in routes/api/
// See bootstrap/app.php for registration.

Route::get('/debug-students', function() {
    $data = \App\Models\Student::with('latestPathway.filiere')->paginate(15);
    file_put_contents(storage_path('logs/debug-students.log'), json_encode($data));
    return $data;
});
