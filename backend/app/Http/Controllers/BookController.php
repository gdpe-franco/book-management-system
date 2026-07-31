<?php

namespace App\Http\Controllers;

use App\Http\Requests\Book\IndexRequest;
use App\Http\Requests\Book\StoreRequest;
use App\Http\Requests\Book\UpdateRequest;
use App\Http\Resources\BookCollection;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Models\User;
use App\Services\BookMutationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BookController extends Controller
{
    public function __construct(private BookMutationService $bookMutations) {}

    public function index(IndexRequest $request): BookCollection
    {
        $this->authorize('viewAny', Book::class);
        $filters = $request->validated();

        return new BookCollection(
            Book::query()
                ->filter($filters)
                ->orderBy($filters['sort_by'] ?? 'id', $filters['sort_direction'] ?? 'asc')
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

        $book = $this->bookMutations->create($request->validated(), $this->actorId($request));

        return BookResource::make($book)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateRequest $request, Book $book): BookResource
    {
        $this->authorize('update', $book);

        $book = $this->bookMutations->update($book, $request->validated(), $this->actorId($request));

        return BookResource::make($book);
    }

    public function destroy(Request $request, Book $book): Response
    {
        $this->authorize('delete', $book);

        $this->bookMutations->delete($book, $this->actorId($request));

        return response()->noContent();
    }

    private function actorId(Request $request): int
    {
        /** @var User $user */
        $user = $request->user();

        return $user->id;
    }
}
