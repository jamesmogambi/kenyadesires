import { zohoFetch } from "@/lib/zoho/client";

async function main() {
  console.log("Testing Zoho CRM API connection...");

  try {
    const response = await zohoFetch("/crm/v2/settings", {
      method: "GET",
    });

    if (!response.ok) {
      console.error("API returned status:", response.status);
      return;
    }

    const data = await response.json();
    console.log("SUCCESS! Zoho CRM is connected.");
    console.log("Organization:", data.organization_info || "N/A");
    console.log("API Version:", data.api_version || "N/A");
  } catch (err: any) {
    console.error("FAILED:", err.message);
  }
}

main();
