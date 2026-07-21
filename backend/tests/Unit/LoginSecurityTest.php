<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use App\Notifications\SuspiciousLoginAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Request;

class LoginSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspicious_login_sends_alert()
    {
        Notification::fake();
        
        $admin = User::factory()->create([
            'role' => 'admin',
            'last_login_ip' => '192.168.1.1'
        ]);

        // Mock the Request facade to return a specific IP
        Request::shouldReceive('ip')->andReturn('10.0.0.5');
        
        event(new Login('web', $admin, false));

        Notification::assertSentTo($admin, SuspiciousLoginAlert::class);
        
        // Assert IP was updated
        $this->assertEquals('10.0.0.5', $admin->fresh()->last_login_ip);
    }

    public function test_same_ip_login_does_not_send_alert()
    {
        Notification::fake();
        
        $admin = User::factory()->create([
            'role' => 'admin',
            'last_login_ip' => '192.168.1.1'
        ]);

        Request::shouldReceive('ip')->andReturn('192.168.1.1');
        
        event(new Login('web', $admin, false));

        Notification::assertNotSentTo($admin, SuspiciousLoginAlert::class);
    }
}
