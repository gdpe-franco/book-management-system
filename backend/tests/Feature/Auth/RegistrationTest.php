<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\PersonalAccessToken;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registers_admin_with_expiring_token(): void
    {
        $now = Carbon::parse('2026-07-28 12:00:00');
        Carbon::setTestNow($now);

        try {
            $response = $this->postJson('/api/v1/auth/register', [
                'name' => 'Admin User',
                'email' => 'admin@example.test',
                'password' => 'testing-password',
                'password_confirmation' => 'testing-password',
            ]);

            $response->assertCreated()
                ->assertJsonPath('data.email', 'admin@example.test')
                ->assertJsonPath('data.role', 'admin')
                ->assertJsonPath('token_type', 'Bearer')
                ->assertJsonStructure(['token']);

            $token = PersonalAccessToken::query()->sole();

            $this->assertSame($now->addDay()->format('Y-m-d H:i:s'), $token->expires_at?->format('Y-m-d H:i:s'));
        } finally {
            Carbon::setTestNow();
        }
    }

    #[DataProvider('invalidRegistrationPayloads')]
    public function test_validates_registration(array $payload, array $errors): void
    {
        $this->postJson('/api/v1/auth/register', $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors($errors);
    }

    public static function invalidRegistrationPayloads(): array
    {
        return [
            'missing name' => [[
                'email' => 'admin@example.test',
                'password' => 'testing-password',
                'password_confirmation' => 'testing-password',
            ], ['name']],
            'invalid email' => [[
                'name' => 'Admin User',
                'email' => 'not-an-email',
                'password' => 'testing-password',
                'password_confirmation' => 'testing-password',
            ], ['email']],
            'unconfirmed password' => [[
                'name' => 'Admin User',
                'email' => 'admin@example.test',
                'password' => 'testing-password',
                'password_confirmation' => 'different-password',
            ], ['password']],
        ];
    }

    public function test_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'admin@example.test']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Admin User',
            'email' => 'admin@example.test',
            'password' => 'testing-password',
            'password_confirmation' => 'testing-password',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }
}
