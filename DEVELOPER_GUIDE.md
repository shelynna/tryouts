
# SML (Smart Monthly Living) - Developer Guide

## 1. Introduction
**SML** (Tagline: *Smart Monthly Living*) is a fintech e-commerce platform designed for students to purchase monthly household essentials using a flexible installment payment model ("Pay Small-Small").

## 2. System Architecture

### 2.1 Tech Stack
- **Frontend**: React 18 (TypeScript), Vite, Tailwind CSS, Framer Motion.
- **Backend**: Supabase (Postgres, Auth, Realtime).
- **Payments**: Paystack (Integrated via Secure Webhooks & RPC).

### 2.2 Core Concepts
- **Cycles**: Fixed monthly windows (e.g., "October Cycle") with automated state transitions (Open -> Locked -> Delivery).
- **Baskets**: User-specific orders tied to an active cycle, supporting multi-payment reconciliation.
- **Top-Ups**: A credit facility for verified Subscribers to complete orders.

## 3. Project Structure
The project follows a modular service-oriented architecture. Core logic is housed in `src/lib/services`, ensuring the UI remains thin and reactive.

## 4. Key Workflows

### 4.1 Authentication & Redirection
- **Flow**: Supports Password and Magic Link (OTP).
- **Environment Awareness**: All authentication redirects (Verification, Password Reset) utilize dynamic origin resolution (`window.location.origin`). This ensures that redirects always match the production domain (e.g., `smlghana.store`) without manual configuration.

### 4.2 Security & Performance
- **CSP**: Implements an Origin-Based Content Security Policy to prevent XSS while allowing trusted payment gateways (Paystack).
- **Resilience**: The Supabase client is wrapped in a custom fetch handler to silently manage network request abortions during navigation.

## 5. Deployment & Production
The application is optimized for deployment as a Static Site (SPA).

- **Build Pipeline**: `npm run build` generates a minified, chunked distribution in `dist/`.
- **Routing**: Client-side routing is supported via `.htaccess` (for Apache/cPanel) or redirect rules (for Vercel/Netlify), ensuring all 404s route to `index.html`.
- **Assets**: Production assets are served from the root `/assets` directory with appropriate cache-control headers.

## 6. Database Management

### 6.1 Resetting the Database
If you are experiencing schema conflicts or want to start fresh:

1.  **Open Supabase SQL Editor**: Go to your project dashboard on Supabase.
2.  **Run Reset Script**: Copy and run the content of `supabase/reset.sql`. This will **WIPE ALL DATA**.
3.  **Apply Master Schema**: Immediately after, copy and run the content of `supabase/schema.sql`.
4.  **Restart App**: Reload your frontend to sync with the new structure.

---
*Built for SML Production Environment.*
