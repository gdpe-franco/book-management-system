<?php

namespace App\Console\Commands;

use App\Clients\OpenLibraryClient;
use App\Models\Book;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class ImportOpenLibraryBooks extends Command
{
    protected $signature = 'books:import-open-library
                            {--subject= : Open Library subject slug to import}
                            {--limit=10 : Number of results to inspect (1-200)}';

    protected $description = 'Import development books from the Open Library Search API.';

    public function __construct(private readonly OpenLibraryClient $openLibrary)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $subject = trim((string) $this->option('subject'));
        $limit = filter_var($this->option('limit'), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => 200],
        ]);

        if ($subject === '' || ! is_int($limit)) {
            $this->components->error('A subject and limit (1-200) are required.');

            return self::FAILURE;
        }

        try {
            $books = $this->openLibrary->searchBySubject($subject, $limit);
            $imported = 0;

            DB::transaction(function () use ($books, &$imported): void {
                foreach ($books as $book) {
                    $model = Book::query()->firstOrCreate(['isbn' => $book['isbn']], $book);

                    if ($model->wasRecentlyCreated) {
                        $imported++;
                    }
                }
            });
        } catch (Throwable) {
            $this->components->error('Open Library import failed. No books were imported.');

            return self::FAILURE;
        }

        $this->components->info("Imported {$imported} books.");

        return self::SUCCESS;
    }
}
