<?php

namespace App\Support;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TemporaryPassword
{
    /**
     * @return array{plain: string, hash: string}
     */
    public static function make(): array
    {
        $plain = Str::password(16);

        return [
            'plain' => $plain,
            'hash' => Hash::make($plain),
        ];
    }

    /**
     * Plain temporary password for User::$casts['password' => 'hashed'].
     */
    public static function plain(): string
    {
        return self::make()['plain'];
    }

    public static function hash(): string
    {
        return self::plain();
    }
}
