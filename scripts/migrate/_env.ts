import dotenv from 'dotenv';

// This file MUST be imported first (side-effect import) so that local
// environment variables from .env.local are populated before any other
// module reads process.env. It has no exports on purpose.
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
  // Fall back to a plain .env if .env.local is absent (e.g. fresh checkout).
  dotenv.config();
}
