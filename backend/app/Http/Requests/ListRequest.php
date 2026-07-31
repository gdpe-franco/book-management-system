<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class ListRequest extends FormRequest
{
    final public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    final public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
            'sort_by' => ['nullable', 'string', Rule::in($this->sortableFields())],
            'sort_direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ];
    }

    /** @return list<string> */
    abstract protected function sortableFields(): array;
}
