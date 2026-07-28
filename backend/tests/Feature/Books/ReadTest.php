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

        $this->getJson('/api/v1/books')
            ->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonStructure(['data', 'meta'])
            ->assertJsonMissingPath('links')
            ->assertJsonMissingPath('meta.links');
    }

    #[DataProvider('filters')]
    public function test_filters_books(string $field, string $value, array $attributes): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create($attributes);
        Book::factory()->create();

        $this->getJson('/api/v1/books?'.http_build_query([$field => " {$value} "]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $book->id);
    }

    public static function filters(): array
    {
        return [
            'title' => ['title', 'Nineteen', ['title' => 'Nineteen Eighty-Four']],
            'author' => ['author', 'Orw', ['author' => 'George Orwell']],
            'isbn' => ['isbn', '978000', ['isbn' => '9780000000000']],
        ];
    }

    public function test_shows_book(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'superadmin']));
        $book = Book::factory()->create();

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $book->id);
    }

    #[DataProvider('protectedEndpoints')]
    public function test_requires_authentication(string $uri): void
    {
        $this->getJson($uri)
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public static function protectedEndpoints(): array
    {
        return [
            'list' => ['/api/v1/books'],
            'show' => ['/api/v1/books/1'],
        ];
    }

    #[DataProvider('invalidPagination')]
    public function test_validates_pagination(string $parameter, int $value): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/v1/books?{$parameter}={$value}")
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

    public function test_limits_isbn_filter_length(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/books?isbn='.str_repeat('1', 18))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['isbn']);
    }

    public function test_returns_not_found_for_unknown_book(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/v1/books/1')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Resource not found.']);
    }
}
