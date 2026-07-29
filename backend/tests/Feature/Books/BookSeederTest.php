<?php

namespace Tests\Feature\Books;

use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_catalogue(): void
    {
        $this->seed();

        $this->assertDatabaseCount('books', 25);
        $this->assertDatabaseHas('books', [
            'title' => 'The Odyssey',
            'isbn' => '9780140268867',
        ]);
    }

    public function test_repeated_seeding_preserves_existing_books(): void
    {
        Book::factory()->create([
            'title' => 'Existing Odyssey',
            'isbn' => '9780140268867',
        ]);

        $this->seed();
        $this->seed();

        $this->assertDatabaseCount('books', 25);
        $this->assertDatabaseHas('books', [
            'title' => 'Existing Odyssey',
            'isbn' => '9780140268867',
        ]);
    }
}
