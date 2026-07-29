<?php

namespace App\Http\Controllers;

use App\Http\Requests\Book\IndexRequest;
use App\Http\Requests\Book\StoreRequest;
use App\Http\Requests\Book\UpdateRequest;
use App\Http\Resources\BookCollection;
use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

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

    public function store(StoreRequest $request): JsonResponse
    {
        $this->authorize('create', Book::class);

        return BookResource::make(Book::query()->create($request->validated()))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateRequest $request, Book $book): BookResource
    {
        $this->authorize('update', $book);

        $book->update($request->validated());

        return BookResource::make($book);
    }

    public function destroy(Book $book): Response
    {
        $this->authorize('delete', $book);

        $book->delete();

        return response()->noContent();
    }
}
