// scripts/test-env.js
require("dotenv").config({ path: ".env.development" });

console.log("Testing environment variables:");
console.log(
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "❌ Missing",
);
console.log(
  "FIREBASE_ADMIN_PROJECT_ID:",
  process.env.FIREBASE_ADMIN_PROJECT_ID || "❌ Missing",
);
console.log(
  "FIREBASE_ADMIN_CLIENT_EMAIL:",
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "❌ Missing",
);
console.log(
  "FIREBASE_ADMIN_PRIVATE_KEY:",
  process.env.FIREBASE_ADMIN_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
);
console.log(
  "REPLICATE_API_TOKEN:",
  process.env.REPLICATE_API_TOKEN ? "✅ Set" : "❌ Missing",
);
