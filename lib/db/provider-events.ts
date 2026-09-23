/**
 * Database access for provider_events audit table.
 */

import { executeQuery } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export type ProviderEventType =
  | "registration"
  | "profile_complete"
  | "verification_started"
  | "verification_complete"
  | "published"
  | "paid_upgrade";

export interface ProviderEventRow {
  id: string;
  provider_lead_id: string | null;
  zoho_entity_id: string | null;
  event_type: string;
  event_data: any;
  zoho_updated: boolean;
  zoho_error: string | null;
  postback_fired: boolean;
  postback_error: string | null;
  created_at: Date;
}

export interface CreateEventInput {
  provider_lead_id?: string;
  zoho_entity_id?: string;
  event_type: ProviderEventType;
  event_data?: any;
}

export async function createProviderEvent(
  input: CreateEventInput,
): Promise<ProviderEventRow> {
  const id = uuidv4();
  await executeQuery<ProviderEventRow>(
    `INSERT INTO provider_events (
      id, provider_lead_id, zoho_entity_id, event_type, event_data
    ) VALUES ($1, $2, $3, $4, $5)`,
    [
      id,
      input.provider_lead_id ?? null,
      input.zoho_entity_id ?? null,
      input.event_type,
      JSON.stringify(input.event_data || {}),
    ],
  );

  const rows = await executeQuery<ProviderEventRow>(
    `SELECT * FROM provider_events WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function updateEventZohoStatus(
  eventId: string,
  updated: boolean,
  error?: string,
): Promise<void> {
  await executeQuery(
    `UPDATE provider_events SET zoho_updated = $2, zoho_error = $3
     WHERE id = $1`,
    [eventId, updated, error ?? null],
  );
}

export async function updateEventPostbackStatus(
  eventId: string,
  fired: boolean,
  error?: string,
): Promise<void> {
  await executeQuery(
    `UPDATE provider_events SET postback_fired = $2, postback_error = $3
     WHERE id = $1`,
    [eventId, fired, error ?? null],
  );
}