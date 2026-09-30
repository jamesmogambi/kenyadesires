/**
 * Persistence helpers for Pesapal orders.
 *
 * These wrap the existing MySQL data layer (`lib/neon.ts` → `lib/db.ts`).
 *
 * ⚠️ TODO: The project does not yet have a `pesapal_orders` table. Run the
 * CREATE TABLE in docs/PESAPAL.md (or the SQL below) before using this module.
 *
 *   CREATE TABLE `pesapal_orders` (
 *     `id`                 varchar(191) NOT NULL,        -- order_tracking_id (PK)
 *     `merchant_reference` varchar(191) DEFAULT NULL,     -- your `id` sent to Pesapal
 *     `user_id`            varchar(191) DEFAULT NULL,     -- Clerk user id
 *     `amount`             decimal(10,2) DEFAULT NULL,
 *     `currency`           varchar(10) DEFAULT 'KES',
 *     `description`        text,
 *     `phone_number`       varchar(32) DEFAULT NULL,
 *     `email`              varchar(255) DEFAULT NULL,
 *     `status`             varchar(32) DEFAULT 'pending',
 *     `package_id`         varchar(64)  DEFAULT NULL,
 *     `package_name`       varchar(128) DEFAULT NULL,
 *     `id_type`            varchar(16)  DEFAULT NULL,     -- 'escort' | 'agency'
 *     `metadata`           json         DEFAULT NULL,
 *     `created_at`         datetime     DEFAULT CURRENT_TIMESTAMP,
 *     `updated_at`         datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 *     PRIMARY KEY (`id`)
 *   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 */

import { executeQuery } from "@/lib/neon";
import { PesapalOrderStatus } from "@/types/pesapal";

export interface PesapalOrderInput {
  orderTrackingId: string;
  merchantReference: string;
  userId?: string | null;
  amount: number | string;
  currency: string;
  description: string;
  phoneNumber?: string;
  email?: string;
  packageId?: string | null;
  packageName?: string | null;
  idType?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PesapalOrder {
  id: string;
  merchant_reference: string | null;
  user_id: string | null;
  amount: number | null;
  currency: string | null;
  description: string | null;
  phone_number: string | null;
  email: string | null;
  status: string;
  package_id: string | null;
  package_name: string | null;
  id_type: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

/** Never downgrade a settled payment. Higher = more final. */
const STATUS_PRIORITY: Record<string, number> = {
  invalid: 0,
  pending: 1,
  failed: 2,
  reversed: 2,
  completed: 3,
};

/**
 * Constant-time string comparison. Used to compare merchant references that
 * arrive from different untrusted sources (IPN callback vs. DB record) so a
 * timing oracle cannot leak whether a reference is partially correct.
 */
export function safeEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const sa = String(a ?? "");
  const sb = String(b ?? "");
  let diff = sa.length ^ sb.length;
  const len = Math.min(sa.length, sb.length);
  for (let i = 0; i < len; i++) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return diff === 0;
}

export async function createOrder(data: PesapalOrderInput): Promise<void> {
  const metadata = data.metadata ? JSON.stringify(data.metadata) : "{}";
  await executeQuery(
    `INSERT INTO pesapal_orders
      (id, merchant_reference, user_id, amount, currency, description, phone_number, email, status, package_id, package_name, id_type, metadata, created_at, updated_at)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, NOW(), NOW())`,
    [
      data.orderTrackingId,
      data.merchantReference,
      data.userId || null,
      data.amount,
      data.currency,
      data.description,
      data.phoneNumber || null,
      data.email || null,
      data.packageId || null,
      data.packageName || null,
      data.idType || null,
      metadata,
    ],
  );
}

export async function getOrder(orderTrackingId: string): Promise<PesapalOrder | null> {
  const rows = await executeQuery<PesapalOrder>(
    `SELECT * FROM pesapal_orders WHERE id = $1 LIMIT 1`,
    [orderTrackingId],
  );
  return rows[0] || null;
}

export async function getOrderStatus(orderTrackingId: string): Promise<string | null> {
  const rows = await executeQuery<{ status: string }>(
    `SELECT status FROM pesapal_orders WHERE id = $1 LIMIT 1`,
    [orderTrackingId],
  );
  return rows[0]?.status || null;
}

/**
 * Idempotently update an order's status.
 *
 * Rules:
 *  - Never overwrite a more-final status with a less-final one
 *    (e.g. "completed" stays "completed"; pending will not clobber "failed").
 *  - If the row does not exist yet, it is inserted so an IPN arriving before the
 *    DB write in the initiate flow is still recorded.
 */
export async function updateOrderStatus(
  orderTrackingId: string,
  newStatus: PesapalOrderStatus,
  merchantReference?: string | null,
  transactionData?: unknown,
): Promise<{ updated: boolean; previous: string | null; reason?: string }> {
  const existing = await getOrderStatus(orderTrackingId);

  if (existing) {
    const newP = STATUS_PRIORITY[newStatus] ?? 1;
    const curP = STATUS_PRIORITY[existing] ?? 1;
    if (newP < curP) {
      console.log(
        `[Pesapal] Skipping status update for ${orderTrackingId}: ` +
          `${existing} -> ${newStatus} (downgrade prevented)`,
      );
      return { updated: false, previous: existing, reason: "downgrade_prevented" };
    }
    if (newP === curP) {
      console.log(
        `[Pesapal] Skipping status update for ${orderTrackingId}: ` +
          `${existing} -> ${newStatus} (no progression)`,
      );
      return { updated: false, previous: existing, reason: "no_progression" };
    }
  }

  const metadata = transactionData ? JSON.stringify(transactionData) : null;

  await executeQuery(
    `INSERT INTO pesapal_orders
       (id, merchant_reference, status, metadata, created_at, updated_at)
     VALUES
       ($1, $2, $3, $4, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       status    = VALUES(status),
       metadata  = COALESCE(VALUES(metadata), metadata),
       updated_at = NOW()`,
    [orderTrackingId, merchantReference || null, newStatus, metadata],
  );

  return { updated: true, previous: existing };
}
