<?php

namespace App\Http\Requests\Book;

use App\Http\Requests\ListRequest;

class IndexRequest extends ListRequest
{
    /** @return list<string> */
    protected function sortableFields(): array
    {
        return ['title', 'author', 'isbn', 'published_year'];
    }
}
