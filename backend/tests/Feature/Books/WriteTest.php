<?php

namespace Tests\Feature\Books;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class WriteTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_book(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('books.store'), [
            'title' => ' The Odyssey ',
            'author' => ' Homer ',
            'isbn' => '9780140268867',
            'published_year' => 1996,
        ])->assertCreated()
            ->assertJsonPath('data.title', 'The Odyssey')
            ->assertJsonPath('data.author', 'Homer');

        $this->assertDatabaseHas('books', [
            'title' => 'The Odyssey',
            'isbn' => '9780140268867',
        ]);
    }

    #[DataProvider('updates')]
    public function test_updates_fields(array $changes): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'superadmin']));
        $book = Book::factory()->create();

        $response = $this->patchJson(route('books.update', $book), $changes)->assertOk();

        foreach ($changes as $field => $value) {
            $response->assertJsonPath("data.{$field}", $value);
        }
    }

    public static function updates(): array
    {
        return [
            'one field' => [['title' => 'Updated title']],
            'two fields' => [['title' => 'Updated title', 'author' => 'Updated author']],
        ];
    }

    public function test_allows_unchanged_isbn(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create(['isbn' => '9780140268867']);

        $this->patchJson(route('books.update', $book), ['isbn' => $book->isbn])->assertOk();
    }

    public function test_rejects_duplicate_isbn(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create(['isbn' => '9780140268867']);

        $this->postJson(route('books.store'), self::bookPayload(['isbn' => $book->isbn]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['isbn']);
    }

    public function test_rejects_another_books_isbn(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create();
        $otherBook = Book::factory()->create(['isbn' => '9780140268867']);

        $this->patchJson(route('books.update', $book), ['isbn' => $otherBook->isbn])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['isbn']);
    }

    public function test_requires_update_fields(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create();

        $this->patchJson(route('books.update', $book), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['book']);
    }

    #[DataProvider('invalidPayloads')]
    public function test_validates_book_payloads(array $payload, array $errors): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson(route('books.store'), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors($errors);
    }

    public static function invalidPayloads(): array
    {
        return [
            'missing title' => [[
                'author' => 'Homer',
                'isbn' => '9780140268867',
                'published_year' => 1996,
            ], ['title']],
            'invalid isbn' => [self::bookPayload(['isbn' => '978-0140268867']), ['isbn']],
            'year before printed editions' => [self::bookPayload(['published_year' => 1449]), ['published_year']],
        ];
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
