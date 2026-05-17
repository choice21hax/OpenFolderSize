import http from '@/api/http';

export interface DirectorySizeResult {
    path: string;
    bytes: number;
    files_scanned: number;
    directories_scanned: number;
    duration_ms: number;
    calculated_at: string;
    cache_ttl_seconds: number;
    cached: boolean;
}

const responseCache = new Map<string, DirectorySizeResult>();
const pendingRequests = new Map<string, Promise<DirectorySizeResult>>();
const serverQueues = new Map<string, Promise<unknown>>();

const createCacheKey = (serverUuid: string, path: string) => `${serverUuid}:${path}`;

const enqueueServerRequest = <T,>(serverUuid: string, task: () => Promise<T>): Promise<T> => {
    const active = serverQueues.get(serverUuid) ?? Promise.resolve();
    const next = active.catch(() => undefined).then(task);

    serverQueues.set(
        serverUuid,
        next.finally(() => {
            if (serverQueues.get(serverUuid) === next) {
                serverQueues.delete(serverUuid);
            }
        })
    );

    return next;
};

export const getCachedDirectorySize = (serverUuid: string, path: string): DirectorySizeResult | undefined =>
    responseCache.get(createCacheKey(serverUuid, path));

export default async (serverUuid: string, path: string): Promise<DirectorySizeResult> => {
    const cacheKey = createCacheKey(serverUuid, path);
    const cached = responseCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const pending = pendingRequests.get(cacheKey);
    if (pending) {
        return pending;
    }

    const request = enqueueServerRequest(serverUuid, async () => {
        const { data } = await http.get<DirectorySizeResult>(
            `/api/client/extensions/openfoldersize/servers/${serverUuid}/directory-size`,
            {
                params: { path },
            }
        );

        responseCache.set(cacheKey, data);

        return data;
    }).finally(() => {
        pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, request);

    return request;
};
