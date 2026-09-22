/**
 * Zoho CRM Contacts service — standard Contacts REST endpoints.
 * Free Edition: standard fields only.
 */

import { zohoFetch } from "@/lib/zoho/client";

export interface ZohoContactPayload {
  First_Name?: string;
  Last_Name?: string;
  Account_Name?: string;
  Phone?: string;
  Mobile?: string;
  Email?: string;
  Skype_ID?: string;
  Twitter?: string;
  City?: string;
  State?: string;
  Country?: string;
  Lead_Source?: string;
  Email_Opt_Out?: boolean;
  Description?: string;
  Title?: string;
}

export interface ZohoContactRecord {
  id: string;
  [key: string]: any;
}

export interface ZohoApiResponse<T = any> {
  code: number;
  message: string;
  data?: T[];
}

/**
 * Create a Contact in Zoho CRM.
 */
export async function createZohoContact(
  payload: ZohoContactPayload,
): Promise<ZohoContactRecord> {
  const response = await zohoFetch("/crm/v8/Contacts", {
    method: "POST",
    body: JSON.stringify({ data: [payload] }),
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoContactRecord;
  }

  const errorDetail =
    result.data?.[0]?.details ||
    result.message ||
    `Zoho create contact failed (HTTP ${response.status})`;

  throw new Error(`createZohoContact: ${errorDetail}`);
}

/**
 * Update a Contact in Zoho CRM.
 */
export async function updateZohoContact(
  contactId: string,
  payload: Partial<ZohoContactPayload>,
): Promise<ZohoContactRecord> {
  const response = await zohoFetch(`/crm/v8/Contacts/${contactId}`, {
    method: "PUT",
    body: JSON.stringify({ data: [payload] }),
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoContactRecord;
  }

  const errorDetail =
    result.data?.[0]?.details ||
    result.message ||
    `Zoho update contact failed (HTTP ${response.status})`;

  throw new Error(`updateZohoContact: ${errorDetail}`);
}

/**
 * Fetch a single Contact by id.
 */
export async function getZohoContact(
  contactId: string,
): Promise<ZohoContactRecord | null> {
  const response = await zohoFetch(`/crm/v8/Contacts/${contactId}`, {
    method: "GET",
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoContactRecord;
  }

  return null;
}