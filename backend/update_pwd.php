<?php
$user = \App\Models\User::where('email', 'admin@encg-fes.ma')->first();
if ($user) {
    $user->password = \Illuminate\Support\Facades\Hash::make('password123');
    $user->save();
    echo "Password updated for " . $user->email . "\n";
} else {
    echo "User not found\n";
}
