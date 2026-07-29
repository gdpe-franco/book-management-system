<?php

namespace App\Clients;

use App\Models\Book;
use Illuminate\Support\Facades\Http;
use UnexpectedValueException;

class OpenLibraryClient
{
    /**
     * @return list<array{title: string, author: string, isbn: string, published_year: int}>
     */
    public function searchBySubject(string $subject, int $limit): array
    {
        $subject = str_replace('_', ' ', $subject);

        $response = Http::baseUrl('https://openlibrary.org')
            ->acceptJson()
            ->timeout(10)
            ->get('search.json', [
                'q' => sprintf('subject:"%s"', str_replace(['\\', '"'], ['\\\\', '\\"'], $subject)),
                'fields' => 'title,author_name,isbn,first_publish_year',
                'limit' => $limit,
            ])
            ->throw();

        $documents = $response->json('docs');

        if (! is_array($documents)) {
            throw new UnexpectedValueException('Open Library returned an invalid response.');
        }

        $books = [];

        foreach ($documents as $document) {
            $book = $this->mapBook($document);

            if ($book !== null) {
                $books[] = $book;
            }
        }

        return $books;
    }

    /**
     * @return array{title: string, author: string, isbn: string, published_year: int}|null
     */
    private function mapBook(mixed $document): ?array
    {
        if (! is_array($document) || ! is_array($document['author_name'] ?? null) || ! is_array($document['isbn'] ?? null)) {
            return null;
        }

        $title = trim((string) ($document['title'] ?? ''));
        $author = implode(', ', array_filter(array_map(
            static fn (mixed $author): string => trim((string) $author),
            $document['author_name'],
        )));
        $year = filter_var($document['first_publish_year'] ?? null, FILTER_VALIDATE_INT);

        $isbn = null;

        foreach ($document['isbn'] as $candidate) {
            $candidate = trim((string) $candidate);

            if (preg_match(Book::ISBN_REGEX, $candidate) === 1) {
                $isbn = $candidate;

                break;
            }
        }

        if ($title === '' || $author === '' || $isbn === null || ! is_int($year) || $year < 1450 || $year > now()->year) {
            return null;
        }

        return [
            'title' => $title,
            'author' => $author,
            'isbn' => $isbn,
            'published_year' => $year,
        ];
    }
}
