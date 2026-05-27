# Smart Cafe QR Ordering System

A modern QR-based cafe ordering web application built with Next.js, Tailwind CSS, Supabase, and `qrcode`.

## Features

- Customer QR menu flow: table-aware menu, customer name/mobile capture, cart, order placement, and order tracking.
- Admin flow: Supabase Auth login, responsive sidebar dashboard, realtime orders, status/payment updates, menu management, settings persistence, and QR generation.
- Supabase-backed API routes for orders, menu, categories, tables, billing, and settings.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Admin login uses Supabase Auth. Create an admin user in Supabase Authentication, then sign in with that email and password.

## Supabase Configuration

Run `database/schema.sql` in your Supabase SQL editor. Then copy `.env.example` to `.env.local` and add your existing Supabase Project URL and publishable key from Supabase Project Settings > API.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Vercel, add the same variables in Project Settings > Environment Variables for Production, Preview, and Development as needed. After saving them, redeploy the project so the deployed app can connect to the existing Supabase database.
