<?php

namespace App\Enums;

enum InternshipStatus: string
{
    case PENDING = 'pending';
    case VALIDATED = 'validated';
    case ACTIVE = 'active';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
