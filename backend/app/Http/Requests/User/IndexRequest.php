<?php

namespace App\Http\Requests\User;

use App\Http\Requests\ListRequest;

class IndexRequest extends ListRequest
{
    /** @return list<string> */
    protected function sortableFields(): array
    {
        return ['name', 'email', 'role', 'created_at'];
    }
}
