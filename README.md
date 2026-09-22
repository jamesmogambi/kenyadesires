# KenyaDesires

KenyaDesires is a modern web application built with **Next.js 15**, providing a platform for connecting users with
services in Kenya. It features a robust administration dashboard, complex search capabilities, and integrations with
multiple cloud services for media and data management.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**:
    - [MongoDB](https://www.mongodb.com/) (via Mongoose)
    - [PostgreSQL](https://neon.tech/) (via Neon Serverless)
- **Media Management**:
    - [Cloudinary](https://cloudinary.com/) (Image hosting and optimization)
    - [Mux](https://www.mux.com/) (Video processing and playback)
    - [AWS S3](https://aws.amazon.com/s3/) (General storage)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/)
- **Email**: [Resend](https://resend.com/)
- **Deployment**: [Vercel](https://vercel.com)

## 📋 Requirements

- **Node.js**: 20.x or higher
- **Package Manager**: npm (or yarn/pnpm/bun)
- **Database Instances**:
    - MongoDB instance (local or Atlas)
    - Neon PostgreSQL instance

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

## 🔑 Environment Variables

The application requires several environment variables to function correctly. Refer to `.env.development` for a
template.

### Core

- `NEXT_PUBLIC_SITE_URL`: Base URL of the site.
- `MONGODB_URI`: Connection string for MongoDB.
- `DATABASE_URL`: Connection string for Neon PostgreSQL.

### Authentication (Clerk)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Cloud Services

- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Mux**: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_SECRET`
- **AWS**: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`
- **Resend**: `RESEND_API_KEY`

## 📂 Project Structure

- `app/`: Next.js App Router (pages, API routes, layouts).
- `actions/` & `server-actions/`: Server-side logic and database operations.
- `components/`: Reusable React components.
- `lib/`: Utility functions, shared logic, and database client initializations.
- `models/`: Mongoose schemas for MongoDB.
- `hooks/`: Custom React hooks.
- `scripts/`: Maintenance and utility scripts.
- `public/`: Static assets.

## 🧪 Testing

- TODO: Add automated tests (found `@playwright/test` in dependencies, but no config file yet).

## 📄 License

This project is licensed under the **MIT License**. See the `package.json` for details.
