<?php

namespace App\Http\Requests\Book;

use App\Models\Book;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, list<string|Rule>>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'author' => ['sometimes', 'required', 'string', 'max:255'],
            'isbn' => [
                'sometimes',
                'required',
                'string',
                'max:13',
                'regex:'.Book::ISBN_REGEX,
                Rule::unique(Book::class)->ignore($this->route('book')),
            ],
            'published_year' => ['sometimes', 'required', 'integer', 'between:1450,'.now()->year],
        ];
    }

    /**
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->hasAny(['title', 'author', 'isbn', 'published_year'])) {
                    $validator->errors()->add('book', 'At least one field is required.');
                }
            },
        ];
    }
}
