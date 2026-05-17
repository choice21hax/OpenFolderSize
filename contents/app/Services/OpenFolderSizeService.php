<?php

namespace Pterodactyl\BlueprintFramework\Extensions\openfoldersize\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Pterodactyl\Models\Server;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class OpenFolderSizeService
{
    private const CACHE_TTL_SECONDS = 300;
    private DaemonFileRepository $files;

    public function __construct(DaemonFileRepository $files)
    {
        $this->files = $files;
    }

    public function get(Server $server, string $path, bool $refresh = false): array
    {
        $normalizedPath = $this->normalizePath($path);
        $cacheKey = $this->cacheKey($server, $normalizedPath);

        if (!$refresh) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                $cached['cached'] = true;

                return $cached;
            }
        }

        $startedAt = microtime(true);
        $payload = $this->calculate($server, $normalizedPath);
        $payload['duration_ms'] = (int) round((microtime(true) - $startedAt) * 1000);
        $payload['cached'] = false;
        $payload['cache_ttl_seconds'] = self::CACHE_TTL_SECONDS;
        $payload['calculated_at'] = now()->toIso8601String();

        Cache::put($cacheKey, Arr::except($payload, ['cached']), now()->addSeconds(self::CACHE_TTL_SECONDS));

        return $payload;
    }

    private function calculate(Server $server, string $path): array
    {
        $directories = 0;
        $files = 0;
        $bytes = 0;
        $queue = [$path];
        $repository = $this->files->setServer($server);

        while (($current = array_pop($queue)) !== null) {
            try {
                $entries = $repository->getDirectory($current);
            } catch (\Throwable $exception) {
                if ($current === $path) {
                    throw $exception;
                }

                continue;
            }

            foreach ($entries as $entry) {
                $name = (string) Arr::get($entry, 'name', '');
                if ($name === '') {
                    continue;
                }

                $isFile = (bool) Arr::get($entry, 'file', true);
                $isDirectory = (bool) Arr::get($entry, 'directory', !$isFile);

                if ($isFile) {
                    $bytes += max(0, (int) Arr::get($entry, 'size', 0));
                    ++$files;

                    continue;
                }

                if (!$isDirectory || (bool) Arr::get($entry, 'symlink', false)) {
                    continue;
                }

                ++$directories;
                $queue[] = $this->joinPath($current, $name);
            }
        }

        return [
            'path' => $path,
            'bytes' => $bytes,
            'files_scanned' => $files,
            'directories_scanned' => $directories,
        ];
    }

    private function cacheKey(Server $server, string $path): string
    {
        return sprintf('openfoldersize:%s:%s', $server->uuid, sha1($path));
    }

    private function normalizePath(string $path): string
    {
        $path = trim(str_replace('\\', '/', $path));
        $path = preg_replace('/^[~$]+(?=\/|$)/', '', $path) ?? $path;

        $segments = array_filter(
            explode('/', $path),
            static fn (string $segment): bool => $segment !== '' && $segment !== '.'
        );

        $normalized = [];
        foreach ($segments as $segment) {
            if ($segment === '..') {
                array_pop($normalized);
                continue;
            }

            $normalized[] = $segment;
        }

        return '/' . implode('/', $normalized);
    }

    private function joinPath(string $directory, string $name): string
    {
        $directory = $directory === '/' ? '' : rtrim($directory, '/');

        return $this->normalizePath($directory . '/' . ltrim($name, '/'));
    }
}
