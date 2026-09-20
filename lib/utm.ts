const UTM_STORAGE_KEY = "kd_utms";

const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type StoredUtms = Partial<Record<(typeof UTM_FIELDS)[number], string>>;

function readStoredUtms(): StoredUtms {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored) as Partial<Record<string, unknown>>;
    const result: StoredUtms = {};

    for (const field of UTM_FIELDS) {
      const value = parsed[field];
      if (typeof value === "string" && value.trim()) {
        result[field] = value.trim();
      }
    }

    return result;
  } catch {
    return {};
  }
}

export function getStoredUtms(): StoredUtms {
  return readStoredUtms();
}

export function captureUtms(): StoredUtms {
  if (typeof window === "undefined") return {};

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const incoming: StoredUtms = {};

    for (const field of UTM_FIELDS) {
      const value = searchParams.get(field);
      if (value?.trim()) {
        incoming[field] = value.trim();
      }
    }

    if (Object.keys(incoming).length === 0) {
      return readStoredUtms();
    }

    const stored = readStoredUtms();
    const merged = { ...stored, ...incoming };
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return readStoredUtms();
  }
}
