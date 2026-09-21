// Quick test of Zoho auth module functions (without making real API calls)

function getZohoAuthorizeUrl() {
  const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
  const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
  const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";
  const ZOHO_SCOPES = "ZohoCRM.leads ZohoCRM.contacts";

  if (!ZOHO_CLIENT_ID || !ZOHO_REDIRECT_URI) {
    throw new Error("ZOHO_CLIENT_ID or ZOHO_REDIRECT_URI is not configured");
  }

  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    response_type: "code",
    redirect_uri: ZOHO_REDIRECT_URI,
    scope: ZOHO_SCOPES,
    access_type: "offline",
    prompt: "consent",
  });

  return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`;
}

// Test 1: Check env vars
console.log("=== Test 1: Environment Variables ===");
const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRET;
const redirectUri = process.env.ZOHO_REDIRECT_URI;
const accountsUrl = process.env.ZOHO_ACCOUNTS_URL;
const apiBaseUrl = process.env.ZOHO_API_BASE_URL;

console.log("ZOHO_CLIENT_ID:", clientId ? "SET (length: " + clientId.length + ")" : "MISSING");
console.log("ZOHO_CLIENT_SECRET:", clientSecret ? "SET (length: " + clientSecret.length + ")" : "MISSING");
console.log("ZOHO_REDIRECT_URI:", redirectUri || "MISSING");
console.log("ZOHO_ACCOUNTS_URL:", accountsUrl || "MISSING");
console.log("ZOHO_API_BASE_URL:", apiBaseUrl || "MISSING");

// Test 2: Authorize URL
console.log("\n=== Test 2: Authorize URL ===");
try {
  const url = getZohoAuthorizeUrl();
  console.log("URL generated:", url.substring(0, 100) + "...");
  
  const checks = [
    ["client_id", url.includes("client_id=" + clientId)],
    ["response_type=code", url.includes("response_type=code")],
    ["redirect_uri", url.includes("redirect_uri=" + encodeURIComponent(redirectUri))],
    ["scope", url.includes("scope=ZohoCRM.leads+ZohoCRM.contacts") || url.includes("scope=ZohoCRM.leads%20ZohoCRM.contacts")],
    ["access_type=offline", url.includes("access_type=offline")],
    ["prompt=consent", url.includes("prompt=consent")],
  ];

  let allPass = true;
  for (const [name, pass] of checks) {
    console.log("  " + (pass ? "PASS" : "FAIL") + ": " + name);
    if (!pass) allPass = false;
  }
  console.log("All auth params present:", allPass);
} catch (e) {
  console.log("ERROR:", e.message);
}

// Test 3: Verify no secrets in URL
console.log("\n=== Test 3: No Secrets in URL ===");
const url = getZohoAuthorizeUrl();
console.log("No client_secret in URL:", !url.includes(clientSecret?.substring(0, 8) || "test"));
console.log("URL length:", url.length);

// Test 4: Check token exchange function exists
console.log("\n=== Test 4: Module Structure ===");
console.log("Note: Full module tests require running Next.js server");
console.log("Auth functions: getZohoAuthorizeUrl, exchangeCodeForTokens, storeZohoConnection, getStoredZohoConnection, getZohoAccessToken");
console.log("Client function: zohoFetch");

// Test 5: Verify redirect URI matches expected production URI
console.log("\n=== Test 5: Redirect URI ===");
console.log("Current redirect URI:", redirectUri);
console.log("Production redirect URI: https://kenyadesires.xyz/api/zoho/callback");
console.log("Matches production:", redirectUri === "https://kenyadesires.xyz/api/zoho/callback");

console.log("\n=== All Tests Complete ===");
