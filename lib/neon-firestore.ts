import 'server-only';
import { randomUUID } from 'node:crypto';
import { query as neonQuery, sql } from '@/lib/neon';

type WhereOperator =
  | '=='
  | '<'
  | '<='
  | '>'
  | '>='
  | '!='
  | 'in'
  | 'not-in'
  | 'array-contains'
  | 'array-contains-any';

interface WhereConstraint {
  field: string;
  operator: WhereOperator;
  value: unknown;
}

interface OrderConstraint {
  field: string;
  direction: 'asc' | 'desc';
}

interface StartAfterConstraint {
  docs: NeonDocumentSnapshot[];
}

type QueryConstraint =
  | WhereConstraint
  | OrderConstraint
  | { type: 'limit'; value: number }
  | StartAfterConstraint
  | { type: 'select'; fields: string[] };

const TABLE_NAMES: Record<string, string> = {
  age: 'lookup_ages',
  breast: 'lookup_breast_sizes',
  character: 'lookup_characters',
  hairColor: 'lookup_hair_colors',
  nationality: 'lookup_nationalities',
  experience: 'lookup_experience_levels',
  languages: 'lookup_languages',
  availability: 'lookup_availability',
  categories: 'lookup_categories',
  practices: 'lookup_practices',
  bdsm: 'lookup_bdsm',
  massage: 'lookup_massage',
  exotic: 'lookup_extra_services',
  blogPosts: 'blog_posts',
  blogCategories: 'blog_categories',
  blogComments: 'blog_comments',
  whatsappCampaigns: 'whatsapp_campaigns',
  whatsappCampaignContacts: 'whatsapp_campaign_contacts',
  contactSubmissions: 'contact_submissions',
  cleaningLogs: 'cleaning_logs',
  processingQueue: 'processing_queue',
  processingLogs: 'processing_logs',
  creditRewards: 'credit_reward_records',
  credit_rewards: 'credit_reward_records',
};

const JSON_COLUMNS = new Set([
  'locations',
  'opening_hours',
  'rates',
  'verification_documents',
  'images_metadata',
  'social_media',
  'pricing',
  'availability_details',
  'cleaning_history',
  'active_packages',
  'awarded_milestones',
  'data',
]);

const PLAN_FIELDS: Record<string, string> = {
  type: 'plan_type',
  isActive: 'plan_is_active',
  features: 'plan_features',
  activatedAt: 'plan_activated_at',
  expiresAt: 'plan_expires_at',
  maxEmployees: 'plan_max_employees',
  maxGalleryImages: 'plan_max_gallery_images',
};

const serverTimestampMarker = { __neonServerTimestamp: true };

export class Timestamp {
  private readonly value: Date;

  constructor(seconds: number | Date, nanoseconds = 0) {
    this.value = seconds instanceof Date
      ? new Date(seconds.getTime() + nanoseconds / 1_000_000)
      : new Date(seconds * 1000 + nanoseconds / 1_000_000);
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(date);
  }

  toDate(): Date {
    return new Date(this.value.getTime());
  }

  toMillis(): number {
    return this.value.getTime();
  }

  valueOf(): number {
    return this.toMillis();
  }
}

export const FieldValue = {
  serverTimestamp: () => serverTimestampMarker,
  increment: (amount: number) => ({ __neonIncrement: amount }),
  arrayUnion: (...values: unknown[]) => ({ __neonArrayUnion: values }),
  arrayRemove: (...values: unknown[]) => ({ __neonArrayRemove: values }),
  delete: () => ({ __neonDelete: true }),
};

function camelCase(value: string): string {
  return value.replace(/_([a-z0-9])/g, (_, character: string) => character.toUpperCase());
}

function snakeCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function tableName(collectionName: string): string {
  return TABLE_NAMES[collectionName] ?? snakeCase(collectionName);
}

function normalizeDate(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (value === serverTimestampMarker) return new Date();
  return value;
}

function normalizeWriteValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (value === serverTimestampMarker) return new Date();
  if (Array.isArray(value)) return value.map(normalizeWriteValue);
  if (value && typeof value === 'object') {
    return JSON.stringify(Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeWriteValue(item)]),
    ));
  }
  return value;
}

function rowValue(row: Record<string, unknown>, field: string): unknown {
  const snake = snakeCase(field);
  if (Object.prototype.hasOwnProperty.call(row, field)) return row[field];
  if (Object.prototype.hasOwnProperty.call(row, snake)) return row[snake];
  return undefined;
}

function compare(left: unknown, operator: WhereOperator, right: unknown): boolean {
  if (left === null || left === undefined) {
    return operator === '!=' ? right !== null && right !== undefined : false;
  }

  switch (operator) {
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    case '>':
      return (left as any) > (right as any);
    case '>=':
      return (left as any) >= (right as any);
    case '<':
      return (left as any) < (right as any);
    case '<=':
      return (left as any) <= (right as any);
    case 'in':
      return (right as unknown[]).includes(left);
    case 'not-in':
      return !(right as unknown[]).includes(left);
    case 'array-contains':
      return Array.isArray(left) && left.includes(right);
    case 'array-contains-any':
      return Array.isArray(left) && (right as unknown[]).some((item) => left.includes(item));
    default:
      return false;
  }
}

function sortValue(value: unknown): unknown {
  if (value instanceof Date) return value.getTime();
  return value === null || value === undefined ? '' : value;
}

function rowToData(row: Record<string, unknown>): Record<string, unknown> {
  const stored = row.data && typeof row.data === 'object'
    ? row.data as Record<string, unknown>
    : {};
  const data: Record<string, unknown> = { ...stored };

  for (const [key, value] of Object.entries(row)) {
    if (key === 'data') continue;
    data[key] = value;
    const camel = camelCase(key);
    if (camel !== key) data[camel] = value;
  }

  return data;
}

function selectedData(data: Record<string, unknown>, fields?: string[]): Record<string, unknown> {
  if (!fields || fields.length === 0) return data;
  const selected: Record<string, unknown> = {};
  for (const field of fields) {
    const value = rowValue(data, field);
    if (value !== undefined) selected[field] = value;
    const camel = camelCase(field);
    if (camel !== field && data[camel] !== undefined) selected[camel] = data[camel];
  }
  return selected;
}

export class NeonDocumentSnapshot {
  readonly exists: boolean;
  readonly id: string;

  constructor(
    readonly ref: NeonDocumentReference,
    private readonly dataValue: Record<string, unknown>,
    exists = true,
  ) {
    this.id = ref.id;
    this.exists = exists;
  }

  data(): Record<string, unknown> {
    return this.dataValue;
  }
}

export class NeonQueryDocumentSnapshot extends NeonDocumentSnapshot {}

function missingSnapshot(ref: NeonDocumentReference): NeonDocumentSnapshot {
  return new NeonDocumentSnapshot(ref, {}, false);
}

export class NeonDocumentReference {
  readonly id: string;
  readonly path: string;

  constructor(
    readonly parent: NeonCollectionReference,
    id?: string,
  ) {
    this.id = id ?? randomUUID();
    this.path = `${parent.path}/${this.id}`;
  }

  async get(): Promise<NeonDocumentSnapshot> {
    const rows = await neonQuery<Record<string, unknown>>(
      `SELECT * FROM ${quoteIdentifier(this.parent.table)} WHERE id = $1`,
      [this.id],
    ).catch((error) => {
      if (error?.code === '42P01') return [];
      throw error;
    });
    return rows.length ? new NeonQueryDocumentSnapshot(this, rowToData(rows[0])) : missingSnapshot(this);
  }

  async set(data: Record<string, unknown>, options?: { merge?: boolean }): Promise<void> {
    const existing = options?.merge ? await this.get() : null;
    const merged = existing?.exists ? { ...existing.data(), ...data } : data;
    const { columns, values, extra } = normalizeWriteData(this.parent.table, { id: this.id, ...merged });

    if (existing?.exists) {
      await updateRow(this.parent.table, this.id, columns, values, extra);
      return;
    }

    const allColumns = [...columns, ...(extra ? ['data'] : [])];
    const allValues = [...values, ...(extra ? [JSON.stringify(extra)] : [])];
    const placeholders = allColumns.map((_, index) => `$${index + 1}`).join(', ');
    await neonQuery(
      `INSERT INTO ${quoteIdentifier(this.parent.table)} (${allColumns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders})`,
      allValues,
    );
  }

  async update(data: Record<string, unknown>): Promise<void> {
    await updateDocument(this.parent.table, this.id, data);
  }

  async delete(): Promise<void> {
    await neonQuery(
      `DELETE FROM ${quoteIdentifier(this.parent.table)} WHERE id = $1`,
      [this.id],
    );
  }
}

export class NeonCollectionReference {
  readonly id: string;
  readonly path: string;
  readonly table: string;

  constructor(collectionName: string) {
    this.id = collectionName;
    this.path = collectionName;
    this.table = tableName(collectionName);
  }

  doc(id?: string): NeonDocumentReference {
    return new NeonDocumentReference(this, id);
  }

  async add(data: Record<string, unknown>): Promise<NeonDocumentReference> {
    const reference = this.doc(randomUUID());
    await reference.set({ id: reference.id, ...data });
    return reference;
  }
}

export class NeonQuery {
  readonly constraints: QueryConstraint[] = [];

  constructor(readonly parent: NeonCollectionReference, constraints: QueryConstraint[] = []) {
    this.constraints.push(...constraints);
  }

  where(field: string, operator: WhereOperator, value: unknown): NeonQuery {
    return new NeonQuery(this.parent, [
      ...this.constraints,
      { field, operator, value },
    ]);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): NeonQuery {
    return new NeonQuery(this.parent, [
      ...this.constraints,
      { field, direction },
    ]);
  }

  limit(value: number): NeonQuery {
    return new NeonQuery(this.parent, [...this.constraints, { type: 'limit', value }]);
  }

  startAfter(...docs: NeonDocumentSnapshot[]): NeonQuery {
    return new NeonQuery(this.parent, [...this.constraints, { docs }]);
  }

  select(...fields: string[]): NeonQuery {
    return new NeonQuery(this.parent, [...this.constraints, { type: 'select', fields }]);
  }

  async get(): Promise<NeonQuerySnapshot> {
    let rows: Record<string, unknown>[];
    try {
      rows = await neonQuery<Record<string, unknown>>(`SELECT * FROM ${quoteIdentifier(this.parent.table)}`);
    } catch (error) {
      if (error?.code === '42P01') return new NeonQuerySnapshot([]);
      throw error;
    }

    const whereConstraints = this.constraints.filter(
      (constraint): constraint is WhereConstraint => 'field' in constraint && 'operator' in constraint,
    );
    const orderConstraints = this.constraints.filter(
      (constraint): constraint is OrderConstraint => 'field' in constraint && 'direction' in constraint,
    );
    const limitConstraint = this.constraints.find(
      (constraint): constraint is { type: 'limit'; value: number } => constraint.type === 'limit',
    );
    const startAfterConstraint = this.constraints.find(
      (constraint): constraint is StartAfterConstraint => 'docs' in constraint,
    );
    const selectConstraint = this.constraints.find(
      (constraint): constraint is { type: 'select'; fields: string[] } => constraint.type === 'select',
    );

    let documents = rows
      .map((row) => new NeonQueryDocumentSnapshot(
        this.parent.doc(String(row.id)),
        rowToData(row),
      ))
      .filter((document) => whereConstraints.every((constraint) => {
        const value = rowValue(document.data(), constraint.field);
        return compare(value, constraint.operator, constraint.value);
      }));

    documents.sort((left, right) => {
      for (const order of orderConstraints) {
        const leftValue = sortValue(rowValue(left.data(), order.field));
        const rightValue = sortValue(rowValue(right.data(), order.field));
        if (leftValue === rightValue) continue;
        const result = leftValue < rightValue ? -1 : 1;
        return order.direction === 'asc' ? result : -result;
      }
      return left.id < right.id ? -1 : 1;
    });

    if (startAfterConstraint?.docs.length) {
      const lastId = startAfterConstraint.docs[startAfterConstraint.docs.length - 1]?.id;
      const lastIndex = documents.findIndex((document) => document.id === lastId);
      documents = documents.slice(lastIndex >= 0 ? lastIndex + 1 : 0);
    }

    if (limitConstraint) documents = documents.slice(0, limitConstraint.value);
    if (selectConstraint) {
      documents = documents.map((document) => new NeonQueryDocumentSnapshot(
        document.ref,
        selectedData(document.data(), selectConstraint.fields),
      ));
    }

    return new NeonQuerySnapshot(documents);
  }
}

export class NeonQuerySnapshot {
  readonly docs: NeonQueryDocumentSnapshot[];
  readonly empty: boolean;
  readonly size: number;

  constructor(documents: NeonQueryDocumentSnapshot[]) {
    this.docs = documents;
    this.empty = documents.length === 0;
    this.size = documents.length;
  }

  data() {
    return { count: this.size };
  }
}

function normalizeWriteData(
  collectionName: string,
  data: Record<string, unknown>,
): { columns: string[]; values: unknown[]; extra: Record<string, unknown> } {
  const table = tableName(collectionName);
  const columns: string[] = [];
  const values: unknown[] = [];
  const extra: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(data)) {
    if (key === 'id') continue;
    const value = normalizeWriteValue(rawValue);

    if (key === 'plan' && value && typeof value === 'string') {
      const plan = JSON.parse(value) as Record<string, unknown>;
      for (const [planKey, column] of Object.entries(PLAN_FIELDS)) {
        if (plan[planKey] !== undefined) {
          columns.push(column);
          values.push(normalizeWriteValue(plan[planKey]));
        }
      }
      extra.plan = plan;
      continue;
    }

    const column = snakeCase(key);
    if (isKnownColumn(table, column)) {
      columns.push(column);
      values.push(value);
    } else {
      extra[camelCase(key)] = rawValue;
    }
  }

  return { columns, values, extra };
}

function isKnownColumn(table: string, column: string): boolean {
  if (column === 'id' || column === 'created_at' || column === 'updated_at') return true;
  if (JSON_COLUMNS.has(column)) return true;
  if (table === 'escorts') {
    return [
      'clerk_user_id', 'name', 'username', 'preview_photo', 'labels', 'email', 'age',
      'telephone', 'whatsapp_phone', 'images', 'videos', 'about', 'availability',
      'ethnicity', 'nationality', 'bust_size', 'breast_size', 'weight', 'zodiac_sign',
      'sexual_orientation', 'gender', 'languages', 'categories', 'country', 'county',
      'county_code', 'regions', 'primary_region', 'locations', 'source', 'practices',
      'bdsm', 'massage', 'extra_services', 'slug', 'role', 'opening_hours', 'rates',
      'age_category', 'character', 'hair_color', 'experience', 'work_type', 'agency_id',
      'agency_role', 'agency_commission_rate', 'is_agency_owned', 'is_agency_featured',
      'is_active', 'is_verified', 'is_featured', 'is_available', 'joined_date', 'gallery',
      'eye_color', 'height', 'body_type', 'tattoos', 'piercings', 'waist', 'hips',
      'specialties', 'pricing', 'availability_details', 'cleaning_history', 'last_cleaned_at',
      'verification_status', 'verification_documents', 'street', 'utm_source', 'utm_medium',
      'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'utm_source_platform',
      'landing_page', 'first_touch_at', 'registration_date', 'watermark_status',
      'watermark_error', 'last_processed_at', 'images_metadata', 'total_images_processed',
      'total_images_failed', 'has_cleaned_images', 'cleaned_images', 'credits', 'plan_type',
      'plan_is_active', 'plan_features', 'plan_activated_at', 'plan_expires_at',
      'active_packages', 'total_bookings', 'total_reviews', 'rating', 'total_views',
    ].includes(column);
  }
  if (table === 'agencies') {
    return [
      'name', 'slug', 'description', 'contact_email', 'contact_phone', 'whatsapp_phone',
      'website', 'owner_id', 'country', 'county', 'county_code', 'region', 'town',
      'regions', 'primary_region', 'estate', 'address', 'street', 'postal_code',
      'business_type', 'categories', 'opening_hours', 'services', 'specialties',
      'is_verified', 'verification_status', 'verification_documents', 'logo', 'cover_image',
      'gallery', 'videos', 'establishment_year', 'languages', 'payment_methods',
      'social_media', 'plan_type', 'plan_is_active', 'plan_features', 'plan_activated_at',
      'plan_expires_at', 'plan_max_employees', 'plan_max_gallery_images', 'active_packages',
      'rating', 'total_reviews', 'total_bookings', 'total_views', 'featured_employees_count',
      'credits', 'is_active', 'is_featured', 'utm_source', 'utm_medium', 'utm_campaign',
      'utm_content', 'utm_term', 'utm_id', 'utm_source_platform', 'landing_page',
      'first_touch_at', 'registration_date',
    ].includes(column);
  }
  if (table === 'blog_posts') {
    return [
      'title', 'slug', 'excerpt', 'body', 'main_image', 'category_slug', 'categories',
      'tags', 'is_published', 'is_featured', 'author_id', 'views',
      'estimated_reading_time', 'published_at',
    ].includes(column);
  }
  if (table === 'blog_comments') {
    return ['post_slug', 'name', 'email', 'content', 'is_approved', 'clerk_user_id'].includes(column);
  }
  if (table === 'whatsapp_campaigns') {
    return [
      'campaign_id', 'name', 'phone_number', 'message_template', 'message', 'status',
      'total_contacts', 'sent_count', 'failed_count', 'skipped_count',
      'last_processed_index', 'scheduled_at', 'started_at', 'completed_at', 'sent_at',
      'delivered_at', 'read_at', 'error_message',
    ].includes(column);
  }
  if (table === 'whatsapp_campaign_contacts') {
    return ['campaign_id', 'escort_id', 'phone_number', 'status', 'msg_id', 'error_message', 'sent_at'].includes(column);
  }
  if (table === 'credit_reward_records') {
    return [
      'clerk_user_id', 'email', 'phone', 'total_credits_awarded', 'awarded_milestones',
      'provider_type', 'provider_id',
    ].includes(column);
  }
  if (table === 'transactions') {
    return [
      'checkout_request_id', 'user_id', 'escort_id', 'agency_id', 'amount', 'currency',
      'status', 'payment_method', 'phone_number', 'callback_url', 'metadata', 'type',
      'package_id', 'account_reference', 'transaction_desc', 'merchant_request_id',
      'completed_at',
    ].includes(column);
  }
  return false;
}

async function updateRow(
  table: string,
  id: string,
  columns: string[],
  values: unknown[],
  extra: Record<string, unknown>,
): Promise<void> {
  const assignments: string[] = [];
  const params: unknown[] = [];

  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    const value = values[index];
    if (value && typeof value === 'object' && '__neonIncrement' in value as object) {
      assignments.push(`${quoteIdentifier(column)} = ${quoteIdentifier(column)} + $${params.length + 1}`);
      params.push((value as { __neonIncrement: number }).__neonIncrement);
    } else if (value && typeof value === 'object' && '__neonArrayUnion' in value as object) {
      assignments.push(`${quoteIdentifier(column)} = COALESCE(${quoteIdentifier(column)}, '{}') || $${params.length + 1}`);
      params.push((value as { __neonArrayUnion: unknown[] }).__neonArrayUnion);
    } else if (value && typeof value === 'object' && '__neonArrayRemove' in value as object) {
      assignments.push(`${quoteIdentifier(column)} = COALESCE(${quoteIdentifier(column)}, '{}') - $${params.length + 1}`);
      params.push((value as { __neonArrayRemove: unknown[] }).__neonArrayRemove);
    } else {
      assignments.push(`${quoteIdentifier(column)} = $${params.length + 1}`);
      params.push(value);
    }
  }

  if (Object.keys(extra).length > 0) {
    assignments.push(`data = COALESCE(data, '{}'::jsonb) || $${params.length + 1}::jsonb`);
    params.push(JSON.stringify(extra));
  }

  if (assignments.length === 0) return;
  assignments.push(`updated_at = NOW()`);
  params.push(id);
  await neonQuery(
    `UPDATE ${quoteIdentifier(table)} SET ${assignments.join(', ')} WHERE id = $${params.length}`,
    params,
  );
}

async function updateDocument(
  table: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const columns: string[] = [];
  const values: unknown[] = [];
  const extra: Record<string, unknown> = {};
  const jsonUpdates: Array<{ column: string; path: string[]; value: unknown }> = [];

  for (const [key, rawValue] of Object.entries(data)) {
    if (key.includes('.')) {
      const [root, ...path] = key.split('.');
      const column = JSON_COLUMNS.has(snakeCase(root)) ? snakeCase(root) : 'data';
      jsonUpdates.push({ column, path, value: normalizeWriteValue(rawValue) });
      continue;
    }

    const value = normalizeWriteValue(rawValue);
    if (key === 'plan' && value && typeof value === 'string') {
      const plan = JSON.parse(value) as Record<string, unknown>;
      for (const [planKey, column] of Object.entries(PLAN_FIELDS)) {
        if (plan[planKey] !== undefined) {
          columns.push(column);
          values.push(normalizeWriteValue(plan[planKey]));
        }
      }
      extra.plan = plan;
      continue;
    }

    const column = snakeCase(key);
    if (isKnownColumn(table, column)) {
      columns.push(column);
      values.push(value);
    } else {
      extra[camelCase(key)] = rawValue;
    }
  }

  await updateRow(table, id, columns, values, extra);

  for (const update of jsonUpdates) {
    const literal = JSON.stringify(update.value);
    const path = update.column === 'data'
      ? `{${[camelCase(update.path[0] ?? ''), ...update.path.slice(1)].map((part) => `"${String(part).replace(/"/g, '\\"')}"`).join(',')}}`
      : `{${update.path.map((part) => `"${String(part).replace(/"/g, '\\"')}"`).join(',')}}`;
    await neonQuery(
      `UPDATE ${quoteIdentifier(table)} SET ${quoteIdentifier(update.column)} = jsonb_set(COALESCE(${quoteIdentifier(update.column)}, '{}'::jsonb), $1, $2::jsonb, true), updated_at = NOW() WHERE id = $3`,
      [path, literal, id],
    );
  }
}

export function collection(_db: unknown, collectionName: string): NeonCollectionReference {
  return new NeonCollectionReference(collectionName);
}

export function doc(
  _db: unknown,
  collectionName: string,
  documentId: string,
): NeonDocumentReference {
  return new NeonDocumentReference(new NeonCollectionReference(collectionName), documentId);
}

export function query(
  parent: NeonCollectionReference | NeonQuery,
  ...constraints: QueryConstraint[]
): NeonQuery {
  return new NeonQuery(parent.parent, [...parent.constraints, ...constraints]);
}

export async function getDocs(neonQueryReference: NeonQuery): Promise<NeonQuerySnapshot> {
  return neonQueryReference.get();
}

export async function getDoc(reference: NeonDocumentReference): Promise<NeonDocumentSnapshot> {
  return reference.get();
}

export async function getCountFromServer(neonQueryReference: NeonQuery): Promise<NeonQuerySnapshot> {
  const snapshot = await neonQueryReference.get();
  return new NeonQuerySnapshot(snapshot.docs);
}

export const db = {};
export const adminDb = {
  collection: (collectionName: string) => new NeonCollectionReference(collectionName),
};

export interface DocumentData {
  [key: string]: any;
}

export interface QueryConstraintType {
  type: string;
  [key: string]: any;
}

declare global {
  namespace FirebaseFirestore {
    interface DocumentSnapshot {
      readonly exists: boolean;
      readonly id: string;
      readonly ref: NeonDocumentReference;
      data(): Record<string, unknown>;
    }

    interface QueryDocumentSnapshot extends DocumentSnapshot {}
  }
}
