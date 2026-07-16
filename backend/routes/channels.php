<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Channel for all professors (for grade deadlines, locking notifications)
Broadcast::channel('professors', function ($user) {
    return $user->hasRole('professor');
});
