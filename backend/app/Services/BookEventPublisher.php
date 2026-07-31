<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Contracts\Redis\Factory as Redis;
use Illuminate\Support\Str;

class BookEventPublisher
{
    public const CREATED = 'book.created';

    public const UPDATED = 'book.updated';

    public const DELETED = 'book.deleted';

    public function __construct(private Redis $redis) {}

    /**
     * @param  array<string, array{before: mixed, after: mixed}>  $changes
     */
    public function publish(Book $book, int $actorId, string $eventType, array $changes = []): void
    {
        $occurredAt = now()->utc();

        $this->redis->connection()->command('xadd', [
            'book-events',
            '*',
            [
                'event_id' => Str::uuid()->toString(),
                'event_type' => $eventType,
                'event_version' => '1',
                'occurred_at' => $occurredAt->toIso8601String(),
                'actor' => json_encode(['id' => $actorId], JSON_THROW_ON_ERROR),
                'book' => json_encode($book->only(['id', 'title', 'author', 'isbn', 'published_year']), JSON_THROW_ON_ERROR),
                'changes' => $changes === [] ? '{}' : json_encode($changes, JSON_THROW_ON_ERROR),
            ],
        ]);

        $this->redis->connection()->command('rawCommand', [
            'XTRIM', 'book-events', 'MINID', '~', ($occurredAt->copy()->subDay()->getTimestamp() * 1000).'-0',
        ]);
    }
}
