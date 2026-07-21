<?php

namespace App\Enums;

enum ValidationStatus: string
{
    case PENDING = 'pending';
    case REVIEWED = 'reviewed';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case ARCHIVED = 'archived';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'En attente',
            self::REVIEWED => 'Vérifié',
            self::APPROVED => 'Approuvé',
            self::REJECTED => 'Rejeté',
            self::ARCHIVED => 'Archivé',
        };
    }
}
