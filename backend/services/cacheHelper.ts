// Cache helper — related file (imported by reportService)

const store = new Map<string, { value: unknown; expiresAt: number }>();

export function setCache(key: string, value: unknown, ttlSeconds: number): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  store.set(key, { value, expiresAt });
}

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  return entry.value as T;
}

export function clearCache(key?: string): void {
  if (key) store.delete(key);
  else store.clear();
}
