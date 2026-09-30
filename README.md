# KenyaDesires

KenyaDesires is a modern web application built with **Next.js 15**, providing a platform for connecting users with
services in Kenya. It features a robust administration dashboard, complex search capabilities, and integrations with
multiple cloud services for media and data management.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**:
    - **MySQL** (primary database — escorts, agencies, transactions, Zoho connections, provider leads)
    - [MongoDB](https://www.mongodb.com/) (via Mongoose — legacy data)
- **Media Management**:
    - [Cloudinary](https://cloudinary.com/) (Image hosting and optimization)
    - [Mux](https://www.mux.com/) (Video processing and playback)
    - [Firebase Storage](https://firebase.google.com/products/storage) (`storage.googleapis.com`)
    - [AWS S3](https://aws.amazon.com/s3/) (General storage)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Email**: [Resend](https://resend.com/)
- **CRM Integration**: [Zoho CRM](https://www.zoho.com/crm/) — OAuth 2.0, lead sync, referral tracking
- **Ad Platform Integration**: [TrafficStars](https://trafficstars.com/) — postback tracking & attribution
- **Deployment**: [Vercel](https://vercel.com)

## 📋 Requirements

- **Node.js**: 20.x or higher
- **Package Manager**: npm (or yarn/pnpm/bun)
- **Database**:
    - MySQL 8.0+ instance (primary)
    - MongoDB instance (local or Atlas) — legacy data only

## 🛠️ Setup & Installation

1. **Clone the repository**:
    ```bash
    git clone git@github.com:jamesmogambi/kenyaDesires.git
    cd kenyadesires
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Environment Variables**:
    Create a `.env.local` file in the root directory and populate it with the required keys (
    see [Environment Variables](#-environment-variables) section).

4. **Run development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:4000](http://localhost:4000) to view the application.

## 📜 Available Scripts

- `npm run dev`: Starts the development server with Turbopack on port 4000.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality.
- `npm run fix-ages`: Runs a custom script to fix invalid ages in the database.
- `npm run migrate`: Runs database migration scripts.
- `npm run zoho-campaigns`: Creates Zoho CRM campaigns from provider leads.
- `npm run zoho-retry`: Retries failed Zoho sync queue entries.

## 🔑 Environment Variables

The application requires several environment variables to function correctly. Refer to `.env.development` for a
template.

### Database (MySQL)

- `MYSQL_HOST`: MySQL server host (default: `127.0.0.1`)
- `MYSQL_PORT`: MySQL server port (default: `3306`)
- `MYSQL_USER`: MySQL username
- `MYSQL_PASSWORD`: MySQL password
- `MYSQL_DATABASE`: MySQL database name

### Core

- `NEXT_PUBLIC_SITE_URL`: Base URL of the site.
- `MONGODB_URI`: Connection string for MongoDB (legacy data).

### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Cloud Services

- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Mux**: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_SECRET`
- **AWS**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- **Resend**: `RESEND_API_KEY`

### Zoho CRM Integration

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REDIRECT_URI`
- `ZOHO_ACCOUNTS_URL` (default: `https://accounts.zoho.com`)
- `ZOHO_API_BASE_URL` (default: `https://www.zohoapis.com`)

### Provider Acquisition (TrafficStars)

- `TRAFFICSTARS_POSTBACK_URL` (default: `https://postback.trafficstars.com`)

## 📂 Project Structure

- `app/`: Next.js App Router (pages, API routes, layouts).
- `server-actions/`: Server-side logic and database operations (MySQL-backed via `executeQuery`).
- `components/`: Reusable React components.
- `lib/`: Utility functions, shared logic, database client initializations.
  - `lib/db.ts`: MySQL connection pool.
  - `lib/neon.ts`: MySQL query helpers (`executeQuery`, `executeTransaction`, `neonPool`, `sql`).
  - `lib/db/`: Database access layer for provider leads, events, referrals, postbacks, Zoho sync queue.
  - `lib/zoho/`: Zoho CRM OAuth, API client, and lead management.
  - `lib/provider-acquisition/`: TrafficStars postback firing and attribution logic.
- `models/`: Mongoose schemas for MongoDB (legacy).
- `hooks/`: Custom React hooks.
- `scripts/`: Maintenance and utility scripts (migrations, campaigns, Zoho retry).
- `public/`: Static assets.

## 🛠️ Database Architecture

### MySQL (Primary)

The application uses MySQL 8.0+ as the primary database for all operational data. Database access is handled
through a centralized layer:

- **`lib/db.ts`**: Creates and exports a MySQL connection pool using `mysql2/promise`.
- **`lib/neon.ts`**: Provides query helper functions:
  - `executeQuery<T>(query, params)`: Converts `$1, $2` param style to MySQL `?` placeholders, executes with retry.
  - `executeQueryOne<T>(query, params)`: Returns a single row or null.
  - `executeTransaction<T>(callback)`: Wraps queries in a transaction with automatic param conversion.
  - `neonPool`: Pool wrapper with retry logic for direct queries.
  - `sql`: Template tag function for ad-hoc queries.

### JSON Column Queries

MySQL stores array columns (e.g., `practices`, `categories`, `regions`, `locations`) as JSON. The following
MySQL 8.0+ functions are used for efficient querying:

- **`JSON_OVERLAPS(json_col, ?)`**: Checks if two JSON arrays share any elements (replaces Postgres `&&` operator).
- **`JSON_TABLE(json_col, '$[*]' ...)`**: Iterates over JSON array elements (replaces Postgres `unnest()`).
- **`JSON_EXTRACT` / `JSON_UNQUOTE`**: Accesses JSON object properties (replaces Postgres `->>` operator).

### Key Database Tables

| Table | Description |
|-------|-------------|
| `escorts` | Escort profiles, rates, photos, credits, verification status |
| `agencies` | Agency profiles, locations, business types |
| `transactions` | User credit purchases and payment records |
| `pesapal_orders` | Pesapal payment orders (order_tracking_id, status, amount, …) |
| `zoho_connections` | Zoho OAuth tokens (access/refresh) |
| `provider_leads` | Leads acquired via TrafficStars and other ad providers |
| `provider_events` | Provider event audit log |
| `provider_referrals` | Referral tracking and rewards |
| `trafficstars_postbacks` | Postback delivery logs with retry tracking |
| `zoho_sync_queue` | Queue for Zoho CRM sync with retry logic |
| `counties` / `regions` | Geographic data |

## 🧪 Testing

- TODO: Add automated tests (found `@playwright/test` in dependencies, but no config file yet).

## 🇰🇪 Pesapal Payments (M-Pesa / Airtel / Cards)

The app integrates **Pesapal API 3.0 - JSON** for Kenyan payments. A custom
`axios` wrapper (`lib/pesapal.ts`) is used instead of the unofficial
`pesapal-v3` npm package because the community package does not cache/refresh
tokens against Pesapal's `expiryDate`, and the codebase already follows a
custom-client pattern (`lib/mpesa.ts`). `axios` (already a dependency) gives
typed errors, timeouts and a single place for the 401 → refresh → retry logic.

Merchant secrets (`PESAPAL_CONSUMER_SECRET`) live only in server env vars and
are never sent to the client.

### Flow
1. **Register IPN once** → `POST /api/pesapal/register-ipn` returns an `ipn_id`
   that you save to `PESAPAL_IPN_ID`.
2. **Customer checks out** → `<PesapalCheckoutButton>` POSTs to
   `POST /api/pesapal/initiate`, which validates input, calls Pesapal
   `SubmitOrderRequest`, saves the order locally, and returns `redirect_url`.
3. **Customer pays on Pesapal's hosted page**, then is redirected back to the
   `callback_url` (`/payment/callback`).
4. **`/payment/callback`** forwards the `OrderTrackingId` to
   `GET /api/pesapal/callback`, which verifies the status with Pesapal's
   `GetTransactionStatus` and redirects to `/payment/success` or `/payment/failed`.
5. **Asynchronously**, Pesapal also hits your IPN
   (`GET|POST /api/pesapal/ipn`), which verifies + updates the order
   idempotently. Pesapal IPNs are never trusted on their own — the status is
   always re-verified via `GetTransactionStatus`.

### Files
- `types/pesapal.ts` — Pesapal response/request type definitions.
- `lib/pesapal.ts` — client: in-memory token cache (5-min TTL), `getAuthToken`,
  `registerIPN`, `submitOrder`, `getTransactionStatus`, 401 refresh+retry (max 2
  attempts), typed `PesapalError`.
- `lib/pesapal-orders.ts` — MySQL order CRUD (insert/update idempotent, constant-
  time `merchant_reference` check).
- `app/api/pesapal/register-ipn/route.ts` — register the IPN.
- `app/api/pesapal/initiate/route.ts` — validate + create order + submit to Pesapal.
- `app/api/pesapal/ipn/route.ts` — GET|POST webhook; verifies & ack with the exact
  `{ orderNotificationType, orderTrackingId, orderMerchantReference, status: 200 }` shape.
- `app/api/pesapal/callback/route.ts` — GET; verifies & 302-redirects to success/fail.
- `app/payment/callback/page.tsx` — loading page that hands off to the callback API.
- `app/payment/success/page.tsx`, `app/payment/failed/page.tsx` — result pages.
- `components/PesapalCheckoutButton.tsx` — reusable checkout button.

### Database
Add the `pesapal_orders` table (the `createOrder`/`updateOrderStatus` helpers in
`lib/pesapal-orders.ts` document it; there is a `TODO` there to map the columns
to your schema):

```sql
CREATE TABLE `pesapal_orders` (
  `id`                 varchar(191) NOT NULL,            -- Pesapal order_tracking_id (PK)
  `merchant_reference` varchar(191) DEFAULT NULL,        -- your `id` sent to Pesapal
  `user_id`            varchar(191) DEFAULT NULL,        -- Clerk user id
  `amount`             decimal(10,2) DEFAULT NULL,
  `currency`           varchar(10) DEFAULT 'KES',
  `description`        text,
  `phone_number`         varchar(32) DEFAULT NULL,
  `email`                varchar(255) DEFAULT NULL,
  `status`               varchar(32) DEFAULT 'pending',  -- pending|completed|failed|reversed|invalid
  `package_id`           varchar(64)  DEFAULT NULL,
  `package_name`         varchar(128) DEFAULT NULL,
  `id_type`              varchar(16)  DEFAULT NULL,
  `metadata`             json         DEFAULT NULL,
  `created_at`           datetime     DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Environment
`.env.development` (sandbox) and `.env.production` — note `.env*` is gitignored.
`.env.example` is the template (force-add with `git add -f .env.example`):

```
PESAPAL_ENV=sandbox
PESAPAL_CONSUMER_KEY=<your key>
PESAPAL_CONSUMER_SECRET=<your secret>
PESAPAL_IPN_ID=<returned by register-ipn>
NEXT_PUBLIC_APP_URL=https://<your-public-https-url>
```

### Sandbox: register the IPN & test end-to-end
1. Start the dev server behind a public HTTPS URL (ngrok) and set
   `NEXT_PUBLIC_APP_URL` to the tunnel URL.
2. Get sandbox test credentials from <https://cybqa.pesapal.com>.
3. Register the IPN (once):
   ```bash
   curl -X POST https://<your-ngrok>/api/pesapal/register-ipn \
     -H "x-api-key: $INTERNAL_API_KEY"
   ```
   Copy the returned `ipn_id` into `PESAPAL_IPN_ID` (in `.env.local`).
4. Hit an escort/agency page that renders `<PesapalCheckoutButton>`, pass the
   boost package details, and complete the sandbox payment (test card / M-Pesa
   stubs).
5. Confirm the callback redirects to `/payment/success` and the IPN fires
   `GET /api/pesapal/ipn` with a 200 ack. Verify the `pesapal_orders` row is
   `completed`.

### Switch to production
1. Set `PESAPAL_ENV=production` and paste live `PESAPAL_CONSUMER_KEY` /
   `PESAPAL_CONSUMER_SECRET` (from your Pesapal dashboard) into
   `.env.production` / `.env.local`.
2. Re-register the IPN against production (the `register-ipn` endpoint uses
   `PESAPAL_ENV`, so it targets `pay.pesapal.com/v3` automatically). Save the
   new `ipn_id` to `PESAPAL_IPN_ID`.
3. Ensure `NEXT_PUBLIC_APP_URL` points to your live HTTPS domain and redeploy.
4. Re-run the checkout against real M-Pesa / cards.

## 📄 License

This project is licensed under the **MIT License**. See `package.json` for details.
