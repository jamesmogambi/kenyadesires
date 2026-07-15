const fs = require("fs");
const path = require("path");

// Only run in production or CI (GitHub Actions)
if (process.env.NODE_ENV !== "production" && !process.env.CI) {
  console.log("⏭️ Skipping config write (development mode)");
  process.exit(0);
}

const configDir = path.join(process.cwd(), "config");
const configPath = path.join(configDir, "firebase-admin.json");

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT environment variable is not set");
  process.exit(1);
}

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

fs.writeFileSync(configPath, serviceAccount, "utf8");
console.log("✅ Firebase config written to", configPath);
