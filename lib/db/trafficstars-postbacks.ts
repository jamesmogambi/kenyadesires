/**
 * Database access for trafficstars_postbacks table.
 */

import { executeQuery, executeQueryOne, executeTransaction } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export type PostbackStatus = "pending" | "sent" | "failed";
export type PostbackEvent =
  | "registration"
  | "profile_complete"
  | "verification"
  | "paid_upgrade";

export interface TrafficstarsPostbackRow {
  id: string;
  click_id: string;
  event: string;
  value: number | null;
  provider_lead_id: string | null;
  status: PostbackStatus;
  attempts: number;
  last_error: string | null;
  sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePostbackInput {
  click_id: string;
  event: PostbackEvent;
  value?: number;
  provider_lead_id?: string;
}

export async function createPostback(
  input: CreatePostbackInput,
): Promise<TrafficstarsPostbackRow> {
  const id = uuidv4();
  const rows = await executeQuery<TrafficstarsPostbackRow>(
    `INSERT INTO trafficstars_postbacks (
      id, click_id, event, value, provider_lead_id, status, attempts
    ) VALUES ($1, $2, $3, $4, $5, 'pending', 0)
    RETURNING *`,
    [id, input.click_id, input.event, input.value ?? null, input.provider_lead_id ?? null],
  );
  return rows[0];
}

export async function findPostbackByClickAndEvent(
  clickId: string,
  event: string,
): Promise<TrafficstarsPostbackRow | null> {
  return executeQueryOne<TrafficstarsPostbackRow>(
    `SELECT * FROM trafficstars_postbacks
     WHERE click_id = $1 AND event = $2
     ORDER BY created_at DESC LIMIT 1`,
    [clickId, event],
  );
}

export async function findPendingPostbacks(
  limit: number = 50,
): Promise<TrafficstarsPostbackRow[]> {
  return executeQuery<TrafficstarsPostbackRow>(
    `SELECT * FROM trafficstars_postbacks
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );
}

export async function markPostbackSent(
  id: string,
): Promise<TrafficstarsPostbackRow | null> {
  return executeQueryOne<TrafficstarsPostbackRow>(
    `UPDATE trafficstars_postbacks
     SET status = 'sent', sent_at = NOW(), attempts = attempts + 1
     WHERE id = $1
     RETURNING *`,
    [id],
  );
}

export async function markPostbackFailed(
  id: string,
  error: string,
): Promise<TrafficstarsPostbackRow | null> {
  return executeQueryOne<TrafficstarsPostbackRow>(
    `UPDATE trafficstars_postbacks
     SET status = 'failed', last_error = $2, attempts = attempts + 1
     WHERE id = $1
     RETURNING *`,
    [id, error],
  );
}

export async function incrementPostbackAttempts(
  id: string,
  error?: string,
): Promise<TrafficstarsPostbackRow | null> {
  return executeQueryOne<TrafficstarsPostbackRow>(
    `UPDATE trafficstars_postbacks
     SET attempts = attempts + 1, last_error = COALESCE($2, last_error)
     WHERE id = $1
     RETURNING *`,
    [id, error ?? null],
  );
}