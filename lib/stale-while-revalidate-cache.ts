export interface CacheEntry<T> {
  value: T;
  expires: number;
}

/** How long an empty fallback is cached when there is no previous value. */
const FAILED_LOAD_RETRY_MS = 5_000;

/**
 * Stale-while-revalidate cache for the CMS reads that back public pages.
 *
 * The Sanity queries behind these keys already degrade to an empty result on
 * timeout (`fetchWithTimeout` in `lib/sanity/queries.ts`). Without a cache that
 * degradation is user-visible: a slow TLS handshake to the Sanity API made the
 * blog render as an empty page instead of a slightly stale one. This keeps the
 * last known good value and serves it while a refresh runs, so a network fault
 * costs freshness rather than content.
 *
 * Three behaviours matter here:
 *   - **Fresh window**: serve from memory, no network at all. This is what
 *     turns a multi-second Sanity read into a map lookup for repeat traffic.
 *   - **Stale window**: serve the last good value immediately and refresh in the
 *     background, so requests never queue behind a slow upstream.
 *   - **In-flight de-duplication**: concurrent misses for the same key share one
 *     upstream call instead of stampeding it.
 *
 * Deliberately dependency-free so it can be exercised without the database or
 * the Sanity client.
 */
export class StaleWhileRevalidateCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly freshMs: number,
    private readonly staleMs: number,
  ) {}

  async resolve<T>(
    key: string,
    load: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (entry && now < entry.expires) {
      return entry.value;
    }

    if (entry && now < entry.expires + this.staleMs) {
      // Stale but usable: answer from memory, refresh for the next reader.
      this.revalidate(key, load, fallback);
      return entry.value;
    }

    try {
      return await this.revalidate(key, load, fallback);
    } catch (error) {
      // `revalidate` swallows loader errors, so reaching here means something
      // unexpected. Serve the last good value if one exists rather than
      // propagating and failing the whole render.
      console.error(`[cache] Unexpected failure for "${key}":`, error);
      return entry ? entry.value : fallback;
    }
  }

  private revalidate<T>(
    key: string,
    load: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    console.log(`[cache] MISS ${key} — fetching from source`);

    const task = load()
      .then((value) => ({ value, ok: true as const }))
      .catch((error) => {
        console.error(
          `[cache] Load failed for "${key}", using fallback:`,
          error,
        );
        return { value: fallback, ok: false as const };
      })
      .then(({ value, ok }) => {
        const previous = this.store.get(key) as CacheEntry<T> | undefined;

        if (!ok && previous) {
          // The upstream is down. Keep serving the last good value rather than
          // overwriting it with an empty one, and expire almost immediately so
          // the next request retries. Without this a single blip replaced real
          // content with `[]` for the whole fresh window.
          this.store.set(key, {
            value: previous.value,
            expires: Date.now(),
          });
          return previous.value;
        }

        this.store.set(key, {
          value,
          // A failed cold load has nothing worth holding onto, so retry sooner
          // instead of serving an empty page for a full fresh window.
          expires: ok
            ? Date.now() + this.freshMs
            : Date.now() + FAILED_LOAD_RETRY_MS,
        });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, task);
    return task;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}
