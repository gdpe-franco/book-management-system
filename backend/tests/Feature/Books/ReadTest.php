<?php

namespace Tests\Feature\Books;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ReadTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_paginated_books(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Book::factory()->count(16)->create();

        $this->getJson(route('books.index'))
            ->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonStructure(['data', 'meta'])
            ->assertJsonMissingPath('links')
            ->assertJsonMissingPath('meta.links');
    }

    #[DataProvider('searches')]
    public function test_searches_books(string $value, array $attributes): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create($attributes);
        Book::factory()->create();

        $this->getJson(route('books.index', ['search' => " {$value} "]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $book->id);
    }

    public static function searches(): array
    {
        return [
            'title' => ['Nineteen', ['title' => 'Nineteen Eighty-Four']],
            'author' => ['Orw', ['author' => 'George Orwell']],
            'isbn' => ['978000', ['isbn' => '9780000000000']],
        ];
    }

    #[DataProvider('sorts')]
    public function test_sorts_books(string $field, mixed $firstValue, mixed $lastValue): void
    {
        Sanctum::actingAs(User::factory()->create());
        $first = Book::factory()->create([$field => $firstValue]);
        Book::factory()->create([$field => $lastValue]);

        $this->getJson(route('books.index', ['sort_by' => $field, 'sort_direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $first->id);
    }

    public static function sorts(): array
    {
        return [
            'title' => ['title', 'A title', 'Z title'],
            'author' => ['author', 'A author', 'Z author'],
            'isbn' => ['isbn', '0000000000000', '9999999999999'],
            'published year' => ['published_year', 1450, 2026],
        ];
    }

    public function test_shows_book(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'superadmin']));
        $book = Book::factory()->create();

        $this->getJson(route('books.show', $book))
            ->assertOk()
            ->assertJsonPath('data.id', $book->id);
    }

    #[DataProvider('protectedEndpoints')]
    public function test_requires_authentication(string $name, array $parameters = []): void
    {
        $this->getJson(route($name, $parameters))
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public static function protectedEndpoints(): array
    {
        return [
            'list' => ['books.index'],
            'show' => ['books.show', [1]],
        ];
    }

    #[DataProvider('invalidPagination')]
    public function test_validates_pagination(string $parameter, int $value): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('books.index', [$parameter => $value]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$parameter]);
    }

    public static function invalidPagination(): array
    {
        return [
            'page below one' => ['page', 0],
            'per page over limit' => ['per_page', 101],
        ];
    }

    #[DataProvider('invalidOrdering')]
    public function test_validates_ordering(string $parameter, string $value): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('books.index', [$parameter => $value]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$parameter]);
    }

    public static function invalidOrdering(): array
    {
        return [
            'unsupported field' => ['sort_by', 'id'],
            'unsupported direction' => ['sort_direction', 'sideways'],
        ];
    }

    public function test_returns_not_found_for_unknown_book(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('books.show', 1))
            ->assertNotFound()
            ->assertExactJson(['message' => 'Resource not found.']);
    }
}
