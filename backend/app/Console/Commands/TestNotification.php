<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\SystemNotification;

class TestNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:notification {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test notification to a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        if ($email) {
            $user = User::where('email', $email)->first();
        } else {
            $user = User::whereHas('roles', function($q) {
                $q->where('name', 'admin');
            })->first();
        }

        if (!$user) {
            $this->error('User not found.');
            return 1;
        }

        $this->info("Sending notification to {$user->email}...");

        $user->notify(new SystemNotification(
            'Test Notification',
            'Ceci est un test de notification interne et par email.',
            'info',
            '/dashboard'
        ));

        $this->info('Notification sent successfully!');
        return 0;
    }
}
