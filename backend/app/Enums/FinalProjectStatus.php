<?php

namespace App\Enums;

enum FinalProjectStatus: string
{
    case SUBMITTED = 'submitted';
    case IN_PROGRESS = 'in_progress';
    case DEFENDED = 'defended';
    case VALIDATED = 'validated';
}
