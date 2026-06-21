/**
 * Central cache configuration for the entire app
 * Change this one value to update all cache durations
 */

// ✅ 7 days in seconds = 60 * 60 * 24 * 7
export const CACHE_DURATION = 604800;

// Optional: Add other common durations
export const CACHE_DURATIONS = {
  ONE_HOUR: 3600,
  SIX_HOURS: 21600,
  TWELVE_HOURS: 43200,
  ONE_DAY: 86400,
  TWO_DAYS: 172800,
  THREE_DAYS: 259200,
  SEVEN_DAYS: 604800,
  THIRTY_DAYS: 2592000,
} as const;

// Export the default duration
export const REVALIDATE_TIME = CACHE_DURATION;
