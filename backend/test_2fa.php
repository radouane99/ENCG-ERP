<?php
$user = \App\Models\User::first();
if ($user) {
    echo "Email: " . $user->email . "\n";
    echo "2FA Enabled: " . $user->two_factor_enabled . "\n";
    echo "2FA Secret: " . $user->two_factor_secret . "\n";
}
exit;
