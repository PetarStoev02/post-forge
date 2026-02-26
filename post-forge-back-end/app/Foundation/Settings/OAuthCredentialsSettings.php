<?php

declare(strict_types=1);

namespace App\Foundation\Settings;

use App\Foundation\Settings\Contracts\SettingsRepository;

final readonly class OAuthCredentialsSettings
{
    private const KEY_PREFIX = 'oauth_';

    public function __construct(
        private SettingsRepository $settings,
    ) {}

    /**
     * Get OAuth client_id and client_secret for a provider (from DB, or null to use env).
     */
    public function get(string $provider): ?array
    {
        $clientId = $this->settings->getValue(self::KEY_PREFIX . $provider . '_client_id');
        $clientSecret = $this->settings->getEncrypted(self::KEY_PREFIX . $provider . '_client_secret');
        if ($clientId === null && $clientSecret === null) {
            return null;
        }

        return [
            'client_id' => $clientId ?? '',
            'client_secret' => $clientSecret ?? '',
        ];
    }

    /**
     * Set OAuth credentials for a provider (stored in DB; secret is encrypted).
     */
    public function set(string $provider, string $clientId, string $clientSecret): void
    {
        $this->settings->setValue(self::KEY_PREFIX . $provider . '_client_id', $clientId);
        $this->settings->setEncrypted(self::KEY_PREFIX . $provider . '_client_secret', $clientSecret);
    }

    /**
     * Return masked info for a provider (e.g. for settings UI: client_id last 4 chars, secret "set" or "not set").
     */
    public function getMasked(string $provider): array
    {
        $clientId = $this->settings->getValue(self::KEY_PREFIX . $provider . '_client_id');
        $secret = $this->settings->getEncrypted(self::KEY_PREFIX . $provider . '_client_secret');

        return [
            'provider' => $provider,
            'clientIdSet' => $clientId !== null && $clientId !== '',
            'clientIdMasked' => $clientId ? substr($clientId, 0, 4) . '…' : null,
            'clientSecretSet' => $secret !== null && $secret !== '',
        ];
    }
}
