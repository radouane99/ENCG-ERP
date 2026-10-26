<?php

return [
    // Enable only after administrators have enrolled their authenticator.
    'enforce_2fa_strict' => (bool) env('ENFORCE_2FA_STRICT', false),
];
