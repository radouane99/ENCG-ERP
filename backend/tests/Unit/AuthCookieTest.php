<?php

namespace Tests\Unit;

use App\Http\Middleware\QueryTokenAuth;
use App\Support\AuthCookie;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;

class AuthCookieTest extends TestCase
{
    public function test_encode_roundtrip_preserves_sanctum_token(): void
    {
        $token = '42|'.str_repeat('a', 40);
        $this->assertSame($token, AuthCookie::decode(AuthCookie::encode($token)));
    }

    public function test_middleware_promotes_http_only_cookie_to_bearer(): void
    {
        $plain = '7|plain-sanctum-token';
        $request = Request::create('/api/v1/auth/me', 'GET', [], [
            AuthCookie::NAME => AuthCookie::encode($plain),
        ]);

        (new QueryTokenAuth)->handle($request, fn () => new Response('ok'));

        $this->assertSame('Bearer '.$plain, $request->headers->get('Authorization'));
    }

    public function test_middleware_ignores_query_string_token(): void
    {
        $request = Request::create('/api/v1/auth/me?token=stolen-token', 'GET');

        (new QueryTokenAuth)->handle($request, fn () => new Response('ok'));

        $this->assertNull($request->headers->get('Authorization'));
    }
}
