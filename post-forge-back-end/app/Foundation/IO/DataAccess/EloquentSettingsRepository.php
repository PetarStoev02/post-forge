<?php

declare(strict_types=1);

namespace App\Foundation\IO\DataAccess;

use App\Foundation\Settings\Contracts\SettingsRepository;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

final readonly class EloquentSettingsRepository implements SettingsRepository
{
    public function getValue(string $key): ?string
    {
        $row = DB::table('settings')->where('key', $key)->first();

        return $row?->value;
    }

    public function setValue(string $key, string $value): void
    {
        $exists = DB::table('settings')->where('key', $key)->exists();
        if ($exists) {
            DB::table('settings')->where('key', $key)->update(['value' => $value, 'updated_at' => now()]);
        } else {
            DB::table('settings')->insert(['key' => $key, 'value' => $value, 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function getEncrypted(string $key): ?string
    {
        $raw = $this->getValue($key);
        if ($raw === null || $raw === '') {
            return null;
        }
        try {
            return Crypt::decryptString($raw);
        } catch (\Throwable) {
            return null;
        }
    }

    public function setEncrypted(string $key, ?string $value): void
    {
        $stored = $value === null || $value === '' ? null : Crypt::encryptString($value);
        $exists = DB::table('settings')->where('key', $key)->exists();
        if ($exists) {
            DB::table('settings')->where('key', $key)->update(['value' => $stored, 'updated_at' => now()]);
        } else {
            DB::table('settings')->insert(['key' => $key, 'value' => $stored, 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
