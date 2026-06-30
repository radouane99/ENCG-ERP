<?php

declare(strict_types=1);

namespace App\Domain\Shared\Contracts;

interface RepositoryInterface
{
    public function findById(int|string $id): ?object;
    public function findAll(array $filters = [], array $orderBy = [], ?int $limit = null): iterable;
    public function save(object $entity): object;
    public function delete(int|string $id): bool;
}
