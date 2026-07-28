<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_current_user(): void
    {
        $user = User::factory()->create(['role' => 'superadmin']);
        $token = $user->createToken('api', ['*'], now()->addDay())->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'superadmin');
    }

    #[DataProvider('unauthenticatedEndpoints')]
    public function test_requires_bearer_token(string $method, string $uri): void
    {
        $this->call($method, $uri)
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    public static function unauthenticatedEndpoints(): array
    {
        return [
            'current user' => ['GET', '/api/v1/me'],
            'logout' => ['POST', '/api/v1/auth/logout'],
        ];
    }

    public function test_rejects_expired_token(): void
    {
        $expiredToken = User::factory()->create()
            ->createToken('api', ['*'], now()->subMinute())
            ->plainTextToken;

        $this->withToken($expiredToken)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_revokes_current_token_only(): void
    {
        $user = User::factory()->create();
        $currentToken = $user->createToken('api', ['*'], now()->addDay());
        $otherToken = $user->createToken('api', ['*'], now()->addDay());

        $this->withToken($currentToken->plainTextToken)->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $currentToken->accessToken->id]);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $otherToken->accessToken->id]);

        Auth::forgetGuards();
        $this->withToken($currentToken->plainTextToken)->getJson('/api/v1/me')->assertUnauthorized();

        Auth::forgetGuards();
        $this->withToken($otherToken->plainTextToken)->getJson('/api/v1/me')->assertOk();
    }
}
