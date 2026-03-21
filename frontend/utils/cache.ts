export interface CacheEnvelope<T> {
  data: T;
  updatedAt: number;
}

export const readCachedResource = <T,>(key: string, maxAgeMs?: number): CacheEnvelope<T> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T> | T;
    if (!parsed || typeof parsed !== 'object') return null;
    if ('updatedAt' in parsed && 'data' in parsed) {
      const envelope = parsed as CacheEnvelope<T>;
      if (maxAgeMs && Date.now() - envelope.updatedAt > maxAgeMs) return envelope;
      return envelope;
    }
    return { data: parsed as T, updatedAt: 0 };
  } catch {
    return null;
  }
};

export const writeCachedResource = <T,>(key: string, data: T) => {
  if (typeof window === 'undefined') return;
  try {
    const envelope: CacheEnvelope<T> = { data, updatedAt: Date.now() };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // ignore storage failures
  }
};
