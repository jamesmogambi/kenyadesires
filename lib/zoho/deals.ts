/**
 * Zoho CRM Deals service — standard Deals REST endpoints.
 * Free Edition: standard fields only.
 */

import { zohoFetch } from "@/lib/zoho/client";

export interface ZohoDealPayload {
  Deal_Name: string;
  Amount?: number;
  Currency?: string;
  Stage?: string;
  Type?: string;
  Lead_Source?: string;
  Description?: string;
  Account_Name?: string;
  Contact_Name?: string;
  Closing_Date?: string; // YYYY-MM-DD
}

export interface ZohoDealRecord {
  id: string;
  [key: string]: any;
}

export interface ZohoApiResponse<T = any> {
  code: number;
  message: string;
  data?: T[];
}

/**
 * Create a Deal in Zoho CRM.
 */
export async function createZohoDeal(
  payload: ZohoDealPayload,
): Promise<ZohoDealRecord> {
  const response = await zohoFetch("/crm/v8/Deals", {
    method: "POST",
    body: JSON.stringify({ data: [payload] }),
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoDealRecord;
  }

  const errorDetail =
    result.data?.[0]?.details ||
    result.message ||
    `Zoho create deal failed (HTTP ${response.status})`;

  throw new Error(`createZohoDeal: ${errorDetail}`);
}