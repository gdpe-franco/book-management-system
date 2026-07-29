<?php

namespace Database\Seeders;

use App\Models\Book;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    /** @var list<array{title: string, author: string, isbn: string, published_year: int}> */
    private const BOOKS = [
        ['title' => 'The Odyssey', 'author' => 'Homer', 'isbn' => '9780140268867', 'published_year' => 1996],
        ['title' => 'Pride and Prejudice', 'author' => 'Jane Austen', 'isbn' => '9780141439518', 'published_year' => 2012],
        ['title' => 'Frankenstein', 'author' => 'Mary Shelley', 'isbn' => '9780141439471', 'published_year' => 2012],
        ['title' => 'Nineteen Eighty-Four', 'author' => 'George Orwell', 'isbn' => '9780451524935', 'published_year' => 1961],
        ['title' => 'Sapiens', 'author' => 'Yuval Noah Harari', 'isbn' => '9780062316097', 'published_year' => 2015],
        ['title' => 'Perfume', 'author' => 'Patrick Süskind', 'isbn' => '9780375725845', 'published_year' => 2001],
        ['title' => 'The Devil Wears Prada', 'author' => 'Lauren Weisberger', 'isbn' => '9780767914765', 'published_year' => 2004],
        ['title' => 'The Divine Comedy', 'author' => 'Dante Alighieri', 'isbn' => '9780451208637', 'published_year' => 2003],
        ['title' => 'One Hundred Years of Solitude', 'author' => 'Gabriel García Márquez', 'isbn' => '9780060883287', 'published_year' => 2006],
        ['title' => 'Dune', 'author' => 'Frank Herbert', 'isbn' => '9780441172719', 'published_year' => 1990],
        ['title' => 'To Kill a Mockingbird', 'author' => 'Harper Lee', 'isbn' => '9780061120084', 'published_year' => 2006],
        ['title' => 'It', 'author' => 'Stephen King', 'isbn' => '9781501142970', 'published_year' => 2016],
        ['title' => "The Handmaid's Tale", 'author' => 'Margaret Atwood', 'isbn' => '9780385490818', 'published_year' => 1998],
        ['title' => 'The Murders in the Rue Morgue', 'author' => 'Edgar Allan Poe', 'isbn' => '9780679643425', 'published_year' => 2006],
        ['title' => 'Wuthering Heights', 'author' => 'Emily Brontë', 'isbn' => '9780141439556', 'published_year' => 2002],
        ['title' => 'The Color Purple', 'author' => 'Alice Walker', 'isbn' => '9780156028356', 'published_year' => 2003],
        ['title' => 'The Little Prince', 'author' => 'Antoine de Saint-Exupéry', 'isbn' => '9780156012195', 'published_year' => 2000],
        ['title' => 'The Second Sex', 'author' => 'Simone de Beauvoir', 'isbn' => '9780307265562', 'published_year' => 2010],
        ['title' => 'Brave New World', 'author' => 'Aldous Huxley', 'isbn' => '9780060850524', 'published_year' => 2006],
        ['title' => 'American Prometheus', 'author' => 'Kai Bird and Martin J. Sherwin', 'isbn' => '9780307424730', 'published_year' => 2007],
        ['title' => 'The Alchemist', 'author' => 'Paulo Coelho', 'isbn' => '9780061122415', 'published_year' => 2006],
        ['title' => 'The Name of the Rose', 'author' => 'Umberto Eco', 'isbn' => '9780156001311', 'published_year' => 1998],
        ['title' => 'The Shadow of the Wind', 'author' => 'Carlos Ruiz Zafón', 'isbn' => '9780143034902', 'published_year' => 2005],
        ['title' => 'Little Women', 'author' => 'Louisa May Alcott', 'isbn' => '9780147514011', 'published_year' => 2014],
        ['title' => 'The Book Thief', 'author' => 'Markus Zusak', 'isbn' => '9780375842207', 'published_year' => 2007],
    ];

    public function run(): void
    {
        foreach (self::BOOKS as $book) {
            Book::query()->firstOrCreate(['isbn' => $book['isbn']], $book);
        }
    }
}
