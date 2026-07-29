<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Facades\DB;

class BookMutationService
{
    public function __construct(private BookEventPublisher $eventPublisher) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, int $actorId): Book
    {
        return DB::transaction(function () use ($attributes, $actorId): Book {
            $book = Book::query()->create($attributes);

            $this->publishAfterCommit($book, $actorId, BookEventPublisher::CREATED);

            return $book;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Book $book, array $attributes, int $actorId): Book
    {
        return DB::transaction(function () use ($book, $attributes, $actorId): Book {
            $before = $book->only(array_keys($attributes));
            $book->update($attributes);

            $changes = [];
            foreach (array_keys($book->getChanges()) as $field) {
                if (array_key_exists($field, $attributes)) {
                    $changes[$field] = ['before' => $before[$field], 'after' => $book->getAttribute($field)];
                }
            }

            $this->publishAfterCommit($book, $actorId, BookEventPublisher::UPDATED, $changes);

            return $book;
        });
    }

    public function delete(Book $book, int $actorId): void
    {
        DB::transaction(function () use ($book, $actorId): void {
            $book->delete();

            $this->publishAfterCommit(
                $book,
                $actorId,
                BookEventPublisher::DELETED,
                ['deleted_at' => ['before' => null, 'after' => $book->deleted_at?->utc()->toIso8601String()]],
            );
        });
    }

    /**
     * @param  array<string, array{before: mixed, after: mixed}>  $changes
     */
    private function publishAfterCommit(Book $book, int $actorId, string $eventType, array $changes = []): void
    {
        DB::afterCommit(function () use ($book, $actorId, $eventType, $changes): void {
            $this->eventPublisher->publish($book, $actorId, $eventType, $changes);
        });
    }
}
