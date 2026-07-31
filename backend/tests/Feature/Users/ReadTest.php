<?php

namespace Tests\Feature\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ReadTest extends TestCase
{
    use RefreshDatabase;

    public function test_lists_paginated_users_newest_first(): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => 'superadmin',
            'created_at' => now()->subDays(3),
        ]));
        User::factory()->create(['created_at' => now()->subDay()]);
        $newer = User::factory()->create(['created_at' => now()]);
        User::factory()->count(14)->create(['created_at' => now()->subHour()]);

        $this->getJson(route('users.index'))
            ->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('meta.per_page', 15)
            ->assertJsonStructure(['data' => [['id', 'name', 'email', 'role', 'created_at']], 'meta'])
            ->assertJsonMissingPath('links')
            ->assertJsonMissingPath('meta.links');
    }

    #[DataProvider('searches')]
    public function test_searches_users(string $value, array $attributes): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => 'superadmin',
            'name' => 'Zebra',
            'email' => 'zebra@internal.test',
        ]));
        $user = User::factory()->create($attributes);
        User::factory()->create(['email' => 'other@internal.test']);

        $this->getJson(route('users.index', ['search' => " {$value} "]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $user->id);
    }

    public static function searches(): array
    {
        return [
            'name' => ['ada', ['name' => 'Ada Lovelace']],
            'email' => ['example.test', ['email' => 'ada@example.test']],
        ];
    }

    #[DataProvider('sorts')]
    public function test_sorts_users(string $field, mixed $firstValue, mixed $lastValue): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => 'superadmin',
            'name' => 'Zebra',
            'email' => 'zebra@internal.test',
        ]));
        $first = User::factory()->create([$field => $firstValue]);
        User::factory()->create([$field => $lastValue]);

        $this->getJson(route('users.index', ['sort_by' => $field, 'sort_direction' => 'asc']))
            ->assertOk()
            ->assertJsonPath('data.0.id', $first->id);
    }

    public static function sorts(): array
    {
        return [
            'name' => ['name', 'Ada', 'Zoe'],
            'email' => ['email', 'ada@example.test', 'zoe@example.test'],
            'role' => ['role', 'admin', 'superadmin'],
            'created at' => ['created_at', now()->subDays(2), now()->subDay()],
        ];
    }

    public function test_forbids_admins(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson(route('users.index'))
            ->assertForbidden()
            ->assertExactJson(['message' => 'Forbidden.']);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson(route('users.index'))
            ->assertUnauthorized()
            ->assertExactJson(['message' => 'Unauthenticated.']);
    }

    #[DataProvider('invalidParameters')]
    public function test_validates_list_parameters(string $parameter, int|string $value): void
    {
        Sanctum::actingAs(User::factory()->create([
            'role' => 'superadmin',
            'name' => 'Zebra',
            'email' => 'zebra@internal.test',
            'created_at' => now()->subWeek(),
        ]));

        $this->getJson(route('users.index', [$parameter => $value]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$parameter]);
    }

    public static function invalidParameters(): array
    {
        return [
            'page below one' => ['page', 0],
            'per page over limit' => ['per_page', 101],
            'unsupported sort field' => ['sort_by', 'id'],
            'unsupported sort direction' => ['sort_direction', 'sideways'],
        ];
    }
}
