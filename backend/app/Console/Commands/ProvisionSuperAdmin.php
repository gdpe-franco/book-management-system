<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class ProvisionSuperAdmin extends Command
{
    protected $signature = 'users:provision-superadmin';

    protected $description = 'Create the configured initial superadmin if it does not exist.';

    public function handle(): int
    {
        $email = config('auth.initial_superadmin.email');
        $password = config('auth.initial_superadmin.password');

        if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL) || ! is_string($password) || $password === '') {
            $this->components->error('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be configured.');

            return self::FAILURE;
        }

        $existingUser = User::query()->where('email', $email)->first();

        if ($existingUser !== null) {
            if ($existingUser->role !== 'superadmin') {
                $this->components->error('The configured account already exists without the superadmin role.');

                return self::FAILURE;
            }

            $this->components->info('Configured superadmin already exists.');

            return self::SUCCESS;
        }

        User::query()->create([
            'name' => 'Super Admin',
            'email' => $email,
            'password' => $password,
            'role' => 'superadmin',
        ]);

        $this->components->info('Superadmin provisioned.');

        return self::SUCCESS;
    }
}
