<?php

namespace Tests\Feature\Books;

use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OpenLibraryImportCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_imports_complete_books_and_skips_existing_isbns(): void
    {
        Book::factory()->create([
            'title' => 'Existing book',
            'isbn' => '9780140268867',
        ]);
        Http::fake([
            'openlibrary.org/search.json*' => Http::response(['docs' => [
                [
                    'title' => 'Replacement title',
                    'author_name' => ['Existing author'],
                    'isbn' => ['9780140268867'],
                    'first_publish_year' => 1996,
                ],
                [
                    'title' => 'Imported book',
                    'author_name' => ['Imported author'],
                    'isbn' => ['invalid', '9780451524935'],
                    'first_publish_year' => 1961,
                ],
                [
                    'title' => 'Incomplete book',
                    'author_name' => ['Missing ISBN'],
                    'first_publish_year' => 2000,
                ],
            ]]),
        ]);

        $this->artisan('books:import-open-library', ['--subject' => 'science_fiction'])->assertSuccessful();

        $this->assertDatabaseCount('books', 2);
        $this->assertDatabaseHas('books', [
            'title' => 'Existing book',
            'isbn' => '9780140268867',
        ]);
        $this->assertDatabaseHas('books', [
            'title' => 'Imported book',
            'isbn' => '9780451524935',
        ]);
        Http::assertSent(
            fn (Request $request): bool => $request['limit'] === 10 && $request['q'] === 'subject:"science fiction"',
        );
    }

    #[DataProvider('failedResponses')]
    public function test_fails_without_persisting_invalid_responses(array $response, int $status): void
    {
        Http::fake(['openlibrary.org/search.json*' => Http::response($response, $status)]);

        $this->artisan('books:import-open-library', ['--subject' => 'science_fiction'])->assertFailed();

        $this->assertDatabaseCount('books', 0);
    }

    public static function failedResponses(): array
    {
        return [
            'unavailable upstream' => [[], 503],
            'malformed payload' => [['docs' => 'invalid'], 200],
        ];
    }
}
