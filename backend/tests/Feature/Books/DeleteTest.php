<?php

namespace Tests\Feature\Books;

use App\Models\Book;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_soft_deletes_book(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $book = Book::factory()->create();

        $this->deleteJson(route('books.destroy', $book))->assertNoContent();

        $this->assertSoftDeleted('books', ['id' => $book->id]);
        $this->getJson(route('books.index'))
            ->assertOk()
            ->assertJsonMissing(['id' => $book->id]);
        $this->getJson(route('books.show', $book))
            ->assertNotFound();
    }
}
