<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_logs_in_admin(): void
    {
        User::factory()->create([
            'email' => 'admin@example.test',
            'password' => 'testing-password',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@example.test',
            'password' => 'testing-password',
        ])->assertOk()
            ->assertJsonPath('data.email', 'admin@example.test')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['token']);
    }

    #[DataProvider('invalidLoginCredentials')]
    public function test_rejects_invalid_credentials(array $payload): void
    {
        User::factory()->create([
            'email' => 'admin@example.test',
            'password' => 'testing-password',
        ]);

        $this->postJson('/api/v1/auth/login', $payload)
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Invalid credentials.']);
    }

    public static function invalidLoginCredentials(): array
    {
        return [
            'unknown email' => [[
                'email' => 'unknown@example.test',
                'password' => 'testing-password',
            ]],
            'incorrect password' => [[
                'email' => 'admin@example.test',
                'password' => 'incorrect-password',
            ]],
        ];
    }
}
