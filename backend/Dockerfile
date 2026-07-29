FROM php:8.4-cli-alpine

RUN apk add --no-cache --virtual .build-deps $PHPIZE_DEPS \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo_mysql \
    && apk del .build-deps
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
