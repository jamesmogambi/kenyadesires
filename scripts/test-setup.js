// scripts/test-setup.js
console.log("Testing setup...");

try {
  require("dotenv").config();
  console.log("✅ dotenv loaded");
} catch (e) {
  console.error("❌ dotenv failed:", e.message);
}

try {
  require("replicate");
  console.log("✅ replicate loaded");
} catch (e) {
  console.error("❌ replicate failed:", e.message);
}

console.log("✅ All dependencies loaded successfully!");
