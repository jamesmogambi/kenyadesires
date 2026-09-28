/**
 * Agency CRM Sync — server actions for Campaign 02 Zoho integration.
 * Uses the existing zohoFetch client (handles OAuth refresh).
 * Standard fields only (Free Edition — no custom fields).
 */

import { zohoFetch } from "@/lib/zoho/client";

export interface ZohoAgencyLeadPayload {
  First_Name: string;
  Last_Name: string;
  Company?: string;
  Title?: string;
  Phone?: string;
  Mobile?: string;
  Email?: string;
  Secondary_Email?: string;
  City?: string;
  State?: string;
  Country?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  Description?: string;
  Website?: string;
}

export interface ZohoLeadRecord {
  id: string;
  created_at?: string;
  modified_at?: string;
  [key: string]: any;
}

export interface ZohoApiResponse<T = any> {
  code: number;
  message: string;
  status?: string;
  data?: T[];
  details?: any;
}

/**
 * Create a Lead in Zoho CRM for agency acquisition.
 */
export async function createZohoAgencyLead(
  payload: ZohoAgencyLeadPayload,
): Promise<ZohoLeadRecord> {
  const response = await zohoFetch("/crm/v8/Leads", {
    method: "POST",
    body: JSON.stringify({ data: [payload] }),
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoLeadRecord;
  }

  const errorDetail =
    result.data?.[0]?.details ||
    result.message ||
    `Zoho create lead failed (HTTP ${response.status})`;

  throw new Error(`createZohoAgencyLead: ${errorDetail}`);
}

/**
 * Update an existing Lead in Zoho CRM.
 */
export async function updateZohoAgencyLead(
  leadId: string,
  payload: Partial<ZohoAgencyLeadPayload>,
): Promise<ZohoLeadRecord> {
  const response = await zohoFetch(`/crm/v8/Leads/${leadId}`, {
    method: "PUT",
    body: JSON.stringify({ data: [payload] }),
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoLeadRecord;
  }

  const errorDetail =
    result.data?.[0]?.details ||
    result.message ||
    `Zoho update lead failed (HTTP ${response.status})`;

  throw new Error(`updateZohoAgencyLead: ${errorDetail}`);
}

/**
 * Convert a Lead to a Contact (and optionally Account).
 */
export async function convertAgencyLeadToContact(
  leadId: string,
  opts: { contactId?: string; dealId?: string; notify?: boolean } = {},
): Promise<{ contact_id?: string; account_id?: string; deal_id?: string }> {
  const params: Record<string, string> = {};
  if (opts.contactId) params.contact_id = opts.contactId;
  if (opts.dealId) params.deal_id = opts.dealId;
  if (opts.notify !== undefined) params.notify = String(opts.notify);

  const response = await zohoFetch(
    `/crm/v8/Leads/${leadId}/actions/convert`,
    {
      method: "POST",
      params,
    },
  );

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0) {
    const data = result.data as any;
    return {
      contact_id: data?.contact_id,
      account_id: data?.account_id,
      deal_id: data?.deal_id,
    };
  }

  throw new Error(
    `convertAgencyLeadToContact: ${result.message || `HTTP ${response.status}`}`,
  );
}

/**
 * Fetch a single Lead by id.
 */
export async function getZohoAgencyLead(
  leadId: string,
): Promise<ZohoLeadRecord | null> {
  const response = await zohoFetch(`/crm/v8/Leads/${leadId}`, {
    method: "GET",
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoLeadRecord;
  }

  return null;
}

/**
 * Search Leads by email (used for dedup before create).
 */
export async function findAgencyLeadByEmail(
  email: string,
): Promise<ZohoLeadRecord | null> {
  const response = await zohoFetch("/crm/v8/Leads/search", {
    method: "GET",
    params: { email },
  });

  const result: ZohoApiResponse = await response.json();

  if (response.ok && result.code === 0 && result.data?.length) {
    return result.data[0] as ZohoLeadRecord;
  }

  return null;
}