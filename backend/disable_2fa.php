<?php
$user = \App\Models\User::where('email', 'radouane.asri99@gmail.com')->first();
if ($user) {
    $user->update(['two_factor_enabled' => false]);
    echo "2FA disabled for " . $user->email . "\n";
}
