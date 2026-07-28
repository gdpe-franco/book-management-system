<?php

namespace App\Http\Controllers;

use App\Http\Requests\Book\IndexRequest;
use App\Http\Resources\BookCollection;
use App\Http\Resources\BookResource;
use App\Models\Book;

class BookController extends Controller
{
    public function index(IndexRequest $request): BookCollection
    {
        $this->authorize('viewAny', Book::class);

        return new BookCollection(
            Book::query()
                ->filter($request->validated())
                ->paginate($request->integer('per_page', 15)),
        );
    }

    public function show(Book $book): BookResource
    {
        $this->authorize('view', $book);

        return BookResource::make($book);
    }
}
