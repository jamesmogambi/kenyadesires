/**
 * Zoho CRM Campaigns service — standard Campaigns REST endpoints.
 * Free Edition: standard fields only.
 */

import { zohoFetch } from "@/lib/zoho/client";

export interface ZohoCampaignPayload {
  Campaign_Name: string;
  Type?: string;
  Status?: string;
  Start_Date?: string; // YYYY-MM-DD
  End_Date?: string;
  Budgeted_Cost?: number;
  Actual_Cost?: number;
  Description?: string;
  UTM_Source?: string;
  UTM_Medium?: string;
  UTM_Campaign?: string;
}

export interface ZohoCampaignRecord {
  id: string;
  [key: string]: any;
}

export interface ZohoApiResponse<T = any> {
  code: number;
  message: string;
  data?: T[];
}

/**
 * Create a Campaign in Zoho CRM.
 */
export async function createZohoCampaign(
  payload: ZohoCampaignPayload,
): Promise<ZohoCampaignRecord> {
  const response = await zohoFetch("/crm/v8/Campaigns", {
    method: "POST",
    body: JSON.stringify({ data: [payload] }),
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoCampaignRecord;
  }

  const errorDetail =
    result.data?.[0]?.details ||
    result.message ||
    `Zoho create campaign failed (HTTP ${response.status})`;

  throw new Error(`createZohoCampaign: ${errorDetail}`);
}

/**
 * List all Campaigns (used to avoid duplicates during setup).
 */
export async function listZohoCampaigns(): Promise<ZohoCampaignRecord[]> {
  const response = await zohoFetch("/crm/v8/Campaigns", {
    method: "GET",
    params: { per_page: "200" },
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data) {
    return result.data as ZohoCampaignRecord[];
  }

  return [];
}