/**
 * Database access for zoho_sync_queue fallback table.
 */

import { executeQuery } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export type SyncStatus = "pending" | "processing" | "done" | "dead";
export type SyncEntityType = "lead" | "contact" | "deal" | "campaign";
export type SyncAction = "create" | "update" | "convert";

export interface ZohoSyncQueueRow {
  id: string;
  entity_type: SyncEntityType;
  action: SyncAction;
  entity_id: string | null;
  zoho_entity_id: string | null;
  payload: any;
  retry_count: number;
  max_retries: number;
  next_retry_at: Date | null;
  status: SyncStatus;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EnqueueSyncInput {
  entity_type: SyncEntityType;
  action: SyncAction;
  entity_id?: string;
  zoho_entity_id?: string;
  payload: any;
  max_retries?: number;
  delay_ms?: number;
}

export async function enqueueSync(
  input: EnqueueSyncInput,
): Promise<ZohoSyncQueueRow> {
  const id = uuidv4();
  const delayMs = input.delay_ms ?? 0;
  const nextRetryAt = new Date(Date.now() + delayMs);

  await executeQuery<ZohoSyncQueueRow>(
    `INSERT INTO zoho_sync_queue (
      id, entity_type, action, entity_id, zoho_entity_id, payload,
      retry_count, max_retries, next_retry_at, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, 'pending')`,
    [
      id,
      input.entity_type,
      input.action,
      input.entity_id ?? null,
      input.zoho_entity_id ?? null,
      JSON.stringify(input.payload),
      input.max_retries ?? 10,
      nextRetryAt,
    ],
  );

  const rows = await executeQuery<ZohoSyncQueueRow>(
    `SELECT * FROM zoho_sync_queue WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function findPendingSyncs(
  limit: number = 50,
): Promise<ZohoSyncQueueRow[]> {
  return executeQuery<ZohoSyncQueueRow>(
    `SELECT * FROM zoho_sync_queue
     WHERE status = 'pending' AND (next_retry_at IS NULL OR next_retry_at <= NOW())
     ORDER BY created_at ASC
     LIMIT $1`,
    [limit],
  );
}

export async function markSyncProcessing(id: string): Promise<void> {
  await executeQuery(
    `UPDATE zoho_sync_queue SET status = 'processing' WHERE id = $1`,
    [id],
  );
}

export async function markSyncDone(id: string, zohoEntityId?: string): Promise<void> {
  await executeQuery(
    `UPDATE zoho_sync_queue SET status = 'done', zoho_entity_id = COALESCE($2, zoho_entity_id)
     WHERE id = $1`,
    [id, zohoEntityId ?? null],
  );
}

export async function markSyncFailed(
  id: string,
  error: string,
  delayMs: number = 5 * 60 * 1000,
): Promise<void> {
  await executeQuery(
    `UPDATE zoho_sync_queue
     SET status = 'pending', retry_count = retry_count + 1,
         last_error = $2,
         next_retry_at = DATE_ADD(NOW(), INTERVAL $3 + 0 MILLISECOND)
     WHERE id = $1`,
    [id, error, delayMs],
  );
}

export async function markSyncDead(id: string, error: string): Promise<void> {
  await executeQuery(
    `UPDATE zoho_sync_queue SET status = 'dead', last_error = $2 WHERE id = $1`,
    [id, error],
  );
}