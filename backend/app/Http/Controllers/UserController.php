<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\IndexRequest;
use App\Http\Resources\UserCollection;
use App\Models\User;

class UserController extends Controller
{
    public function index(IndexRequest $request): UserCollection
    {
        $this->authorize('viewAny', User::class);
        $filters = $request->validated();
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        return new UserCollection(
            User::query()
                ->filter($filters)
                ->orderBy($sortBy, $sortDirection)
                ->orderBy('id', 'desc')
                ->paginate($request->integer('per_page', 15)),
        );
    }
}
