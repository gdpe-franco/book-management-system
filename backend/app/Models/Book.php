<?php

namespace App\Models;

use Database\Factories\BookFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['title', 'author', 'isbn', 'published_year'])]
class Book extends Model
{
    public const ISBN_REGEX = '/^(?:\d{9}[\dXx]|\d{13})$/';

    /** @use HasFactory<BookFactory> */
    use HasFactory, SoftDeletes;

    /**
     * @param  Builder<static>  $query
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): void
    {
        foreach (['title', 'author', 'isbn'] as $field) {
            $value = trim((string) ($filters[$field] ?? ''));

            if ($value !== '') {
                $query->whereLike($field, "%{$value}%");
            }
        }
    }
}
