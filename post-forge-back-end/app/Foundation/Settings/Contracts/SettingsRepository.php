<?php

declare(strict_types=1);

namespace App\Foundation\Settings\Contracts;

interface SettingsRepository
{
    /**
     * Get a plain-text setting value by key.
     */
    public function getValue(string $key): ?string;

    /**
     * Set a plain-text setting value (upsert).
     */
    public function setValue(string $key, string $value): void;

    /**
     * Get an encrypted setting value by key (decrypted on read).
     */
    public function getEncrypted(string $key): ?string;

    /**
     * Set an encrypted setting value (encrypted on write, upsert).
     */
    public function setEncrypted(string $key, ?string $value): void;
}
