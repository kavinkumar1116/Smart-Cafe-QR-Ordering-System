# Smart Cafe QR Ordering System

A modern QR-based cafe ordering web application built with Next.js, Tailwind CSS, Supabase, and `qrcode`.

## Features

- Customer QR menu flow: table-aware menu, customer name/mobile capture, cart, order placement, and order tracking.
- Admin flow: local login, responsive sidebar dashboard, live orders, status/payment updates, menu management, and QR generation.
- Supabase-ready API routes with a demo fallback when database environment variables are not configured.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Admin login:

- Username: `admin`
- Password: `1234`

## Supabase Configuration

Run `database/schema.sql` in your Supabase SQL editor. Then copy `.env.example` to `.env.local` and add your existing Supabase Project URL and anon key from Supabase Project Settings > API.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=1234
```

For Vercel, add the same variables in Project Settings > Environment Variables for Production, Preview, and Development as needed. After saving them, redeploy the project so the deployed app can connect to the existing Supabase database.
