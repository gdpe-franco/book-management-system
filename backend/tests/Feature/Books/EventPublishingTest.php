<?php

namespace Tests\Feature\Books;

use App\Models\Book;
use App\Models\User;
use App\Services\BookMutationService;
use Illuminate\Contracts\Redis\Connection;
use Illuminate\Contracts\Redis\Factory as Redis;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class EventPublishingTest extends TestCase
{
    use RefreshDatabase;

    #[DataProvider('mutations')]
    public function test_publishes_mutation(string $operation, string $eventType, string $expectedTitle, array $expectedChanges): void
    {
        $event = [];
        $this->captureRedisStreamEvent($event);

        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $book = Book::factory()->create(['title' => 'The Odyssey']);

        $response = match ($operation) {
            'create' => $this->postJson(route('books.store'), self::bookPayload()),
            'update' => $this->patchJson(route('books.update', $book), ['title' => 'Odyssey']),
            'delete' => $this->deleteJson(route('books.destroy', $book)),
        };

        $response->assertSuccessful();

        $this->assertSame($eventType, $event['event_type']);
        $this->assertSame('1', $event['event_version']);
        $this->assertSame(['id' => $user->id], json_decode($event['actor'], true, flags: JSON_THROW_ON_ERROR));
        $this->assertMatchesRegularExpression('/^[\da-f-]{36}$/', $event['event_id']);
        $this->assertStringEndsWith('+00:00', $event['occurred_at']);
        $changes = json_decode($event['changes'], true, flags: JSON_THROW_ON_ERROR);
        if ($operation === 'delete') {
            $this->assertNull($changes['deleted_at']['before']);
            $this->assertNotEmpty($changes['deleted_at']['after']);
        } else {
            $this->assertSame($expectedChanges, $changes);
        }
        if ($operation === 'create') {
            $this->assertSame('{}', $event['changes']);
        }

        $snapshot = json_decode($event['book'], true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame($expectedTitle, $snapshot['title']);
    }

    public static function mutations(): array
    {
        return [
            'creation' => ['create', 'book.created', 'The Odyssey', []],
            'update' => ['update', 'book.updated', 'Odyssey', ['title' => ['before' => 'The Odyssey', 'after' => 'Odyssey']]],
            'soft deletion' => ['delete', 'book.deleted', 'The Odyssey', []],
        ];
    }

    public function test_does_not_publish_failed_mutation(): void
    {
        $event = [];
        $this->captureRedisStreamEvent($event, false);
        $user = User::factory()->create();
        $book = Book::factory()->create(['isbn' => '9780140268867']);

        try {
            app(BookMutationService::class)->create(self::bookPayload(['isbn' => $book->isbn]), $user->id);
            $this->fail('Expected the duplicate ISBN to fail.');
        } catch (QueryException) {
            $this->assertSame([], $event);
        }
    }

    /**
     * @param  array<string, string>  $event
     */
    private function captureRedisStreamEvent(array &$event, bool $publishes = true): void
    {
        $connection = Mockery::mock(Connection::class);
        $expectation = $connection->shouldReceive('command');

        if (! $publishes) {
            $expectation->never();
        } else {
            $expectation->once()
                ->withArgs(static fn (string $command, array $arguments): bool => $command === 'xadd'
                    && $arguments[0] === 'book-events'
                    && $arguments[1] === '*'
                    && is_array($arguments[2]))
                ->andReturnUsing(function (string $command, array $arguments) use (&$event): string {
                    $event = $arguments[2];

                    return '1-0';
                });
            $connection->shouldReceive('command')->once()
                ->withArgs(static fn (string $command, array $arguments): bool => $command === 'rawCommand'
                    && $arguments[0] === 'XTRIM'
                    && $arguments[1] === 'book-events'
                    && $arguments[2] === 'MINID'
                    && $arguments[3] === '~'
                    && preg_match('/^\d+-0$/', $arguments[4]) === 1);
        }

        $redis = Mockery::mock(Redis::class);
        $redis->shouldReceive('connection')->andReturn($connection);
        $this->app->instance(Redis::class, $redis);
    }

    /**
     * @return array<string, int|string>
     */
    private static function bookPayload(array $overrides = []): array
    {
        return [
            'title' => 'The Odyssey',
            'author' => 'Homer',
            'isbn' => '9780140268867',
            'published_year' => 1996,
            ...$overrides,
        ];
    }
}
