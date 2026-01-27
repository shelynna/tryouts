# Sɔ ME MU (SMM) - Developer Guide

## 1. Introduction
**Sɔ ME MU (SMM)** (Tagline: *Smart Monthly Living*) is a fintech-enabled e-commerce platform designed for students to purchase monthly household essentials (rice, oil, canned goods) using a flexible installment payment model ("Pay Small-Small").

The system bridges the gap between monthly bulk purchasing needs and daily student cash flow constraints.

## 2. System Architecture

### 2.1 Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Utility-first), Framer Motion (Animations)
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Payments**: Paystack (via JS SDK)

### 2.2 Core Concepts
- **Cycles**: The platform operates in monthly windows (e.g., "October Cycle"). A cycle has an `Open Date` (shopping starts), `Lock Date` (modifications end), and `Delivery Date`.
- **Baskets**: A user's cart for a specific cycle. It persists across sessions and tracks payment progress.
- **Installments**: Users can pay any amount at any time towards their basket total.
- **Delivery Code**: A unique QR-compatible code generated only when a basket is 100% paid.

## 3. Project Structure

```
/src
├── assets/          # Static images (Hero, Products, Patterns)
├── components/      # React Components
│   ├── auth/        # Feature gating and auth-related UI
│   ├── dashboard/   # Admin and User dashboard widgets
│   ├── landing/     # Landing page sections
│   ├── layout/      # Shells (Header, Footer, Sidebar)
│   ├── products/    # Product display and interaction
│   └── ui/          # Atomic design elements (Button, Input, Modal)
├── context/         # Global State Providers
│   ├── AuthContext  # User session, profile sync, role management
│   └── BasketContext# Cart logic, totals calculation, optimistic updates
├── hooks/           # Custom hooks (e.g., useRBAC)
├── lib/             # Logic layer
│   ├── api.ts       # Centralized API service layer
│   ├── supabase.ts  # Supabase client initialization
│   ├── logger.ts    # Error logging utility
│   └── utils.ts     # Formatting helpers
├── pages/           # Route-level views (AdminDashboard, UserDashboard, etc.)
└── types/           # TypeScript interfaces and Enums
```

## 4. Key Workflows

### 4.1 Authentication
- **Provider**: Supabase Auth (Email/Password).
- **Profile Creation**: A PostgreSQL trigger (`handle_new_user`) automatically creates a user profile in the `public.profiles` table upon signup.
- **Self-Healing**: The `AuthContext` checks for a profile on load. If missing (due to trigger failure), it calls the `ensure_user_profile` RPC function to generate it immediately.

### 4.2 Basket Management
- **Optimistic UI**: Changes to the basket (add/remove items) are reflected instantly in the UI while the API request processes in the background.
- **Locking**: When the current date passes the cycle's `Lock Date`, the backend policies and frontend UI disable modification controls.

### 4.3 Payments
1. User initiates payment (e.g., GHS 50).
2. Paystack Popup handles the Mobile Money transaction.
3. On success, the frontend calls `API.verifyPayment`.
4. **Backend Verification**: A Supabase RPC function (`process_payment`) records the transaction and updates the basket's `amount_paid`.
5. **Completion**: If `amount_paid >= total_price`, the status updates to `PAID` and a `delivery_code` is generated.

### 4.4 Admin Console
Access is restricted to users with `role: 'ADMIN'`.
- **Overview**: Real-time stats on revenue and completion rates.
- **Products**: Add/Edit/Hide inventory items.
- **Cycle**: Configure fee percentages and cycle dates.
- **Pickup**: Scan student delivery codes to mark items as `COLLECTED`.
- **Logs**: View frontend errors and system events.

## 5. Database Schema (Supabase)

### Tables
- `profiles`: Extends Auth users with phone, pickup point, role.
- `products`: Inventory items with pricing and stock status.
- `baskets`: Links users to cycles and stores financial snapshots.
- `basket_items`: Junction table for products in a basket.
- `payments`: Transaction history.
- `cycles`: Configuration for shopping windows.
- `system_logs`: Error tracking.

### RLS Policies
Row Level Security is enabled on all tables.
- **Users**: Can only read/edit their own data.
- **Admins**: Have full access via `public.is_admin()` policy.

## 6. Setup Instructions

1. **Clone Repository**:
   ```bash
   git clone <repo_url>
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create `.env` based on the template:
   ```bash
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_PAYSTACK_PUBLIC_KEY=...
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 7. Deployment
The app is designed to be deployed as a static site (SPA).
- **Build**: `npm run build`
- **Output**: `dist/` folder.
- **Host**: Vercel, Netlify, or any static hosting provider.
- **Routes**: Configure host to rewrite all 404s to `index.html` for client-side routing.

## 8. Image Management (Supabase Storage)

Product and hero images should be stored in Supabase Storage to allow for dynamic updates through the admin panel.

1.  **Create a Bucket**: In your Supabase project, create a public storage bucket named `assets`.
2.  **Upload Images**: Upload your product images into this bucket.
3.  **Get Public URL**: The public URL for an asset can be constructed as follows:
    `{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{FILE_PATH}`
    
    Example: `https://your-project.supabase.co/storage/v1/object/public/assets/products/rice_5kg.png`

When adding or editing a product in the admin UI, use this full public URL in the "Image Source (URL)" field. The frontend is configured to render these URLs directly.

---
*Built with ❤️ for Sɔ ME MU.*