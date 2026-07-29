<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use LogicException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        if ($app['config']->get('database.default') !== 'mysql_testing') {
            throw new LogicException('Tests must use the mysql_testing connection.');
        }

        if ((int) $app['config']->get('database.redis.default.database') !== 2) {
            throw new LogicException('Tests must use Redis database 2.');
        }

        return $app;
    }
}
