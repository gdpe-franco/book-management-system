<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProvisionSuperAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('auth.initial_superadmin', [
            'email' => 'superadmin@example.test',
            'password' => 'testing-password',
        ]);
    }

    public function test_provisions_configured_superadmin(): void
    {
        $this->artisan('users:provision-superadmin')->assertSuccessful();
        $this->artisan('users:provision-superadmin')->assertSuccessful();

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', [
            'email' => 'superadmin@example.test',
            'role' => 'superadmin',
        ]);
    }

    public function test_defaults_users_to_admin(): void
    {
        $user = User::query()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.test',
            'password' => 'testing-password',
        ]);

        $this->assertSame('admin', $user->fresh()->role);
    }

    public function test_refuses_admin_promotion(): void
    {
        User::factory()->create([
            'email' => 'superadmin@example.test',
            'role' => 'admin',
        ]);

        $this->artisan('users:provision-superadmin')->assertFailed();

        $this->assertDatabaseHas('users', [
            'email' => 'superadmin@example.test',
            'role' => 'admin',
        ]);
    }

    public function test_requires_configuration(): void
    {
        config()->set('auth.initial_superadmin', [
            'email' => null,
            'password' => null,
        ]);

        $this->artisan('users:provision-superadmin')->assertFailed();
    }
}
