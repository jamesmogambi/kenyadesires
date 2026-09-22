// scripts/test-env.js
require("dotenv").config({ path: ".env.development" });

console.log("Testing environment variables:");
console.log(
  "REPLICATE_API_TOKEN:",
  process.env.REPLICATE_API_TOKEN ? "✅ Set" : "❌ Missing",
);
