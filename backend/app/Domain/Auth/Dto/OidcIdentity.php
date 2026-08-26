<?php

declare(strict_types=1);

namespace App\Domain\Auth\Dto;

final readonly class OidcIdentity
{
    public function __construct(
        public string $provider,
        public string $subject,
        public string $email,
        public ?string $name = null,
    ) {}
}
