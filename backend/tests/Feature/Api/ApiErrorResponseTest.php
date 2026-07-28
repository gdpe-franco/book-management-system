<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ApiErrorResponseTest extends TestCase
{
    public function test_standardizes_client_errors(): void
    {
        Route::get('/api/v1/test-forbidden', fn () => abort(403));

        $this->get('/api/v1/test-forbidden')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Forbidden.']);

        $this->get('/api/v1/not-found')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_hides_server_error_details(): void
    {
        Route::get('/api/v1/test-server-error', function (): never {
            throw new RuntimeException('Internal detail');
        });

        $this->get('/api/v1/test-server-error')
            ->assertStatus(500)
            ->assertExactJson(['message' => 'Server error.']);
    }
}
