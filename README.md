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
| `zoho_connections` | Zoho OAuth tokens (access/refresh) |
| `provider_leads` | Leads acquired via TrafficStars and other ad providers |
| `provider_events` | Provider event audit log |
| `provider_referrals` | Referral tracking and rewards |
| `trafficstars_postbacks` | Postback delivery logs with retry tracking |
| `zoho_sync_queue` | Queue for Zoho CRM sync with retry logic |
| `counties` / `regions` | Geographic data |

## 🧪 Testing

- TODO: Add automated tests (found `@playwright/test` in dependencies, but no config file yet).

## 📄 License

This project is licensed under the **MIT License**. See the `package.json` for details.
