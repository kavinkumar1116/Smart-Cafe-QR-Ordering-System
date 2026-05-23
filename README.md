# Smart Cafe QR Ordering System

A modern QR-based cafe ordering web application built with Next.js, Tailwind CSS, PostgreSQL, `pg`, and `qrcode`.

## Features

- Customer QR menu flow: table-aware menu, customer name/mobile capture, cart, order placement, and order tracking.
- Admin flow: local login, responsive sidebar dashboard, live orders, status/payment updates, menu management, and QR generation.
- PostgreSQL-ready API routes with a demo fallback when database environment variables are not configured.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Admin login:

- Username: `admin`
- Password: `1234`

## Database

Create a PostgreSQL database and run `database/schema.sql`. Then copy `.env.example` to `.env.local` and update the credentials.

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=cafe_qr_db
DB_PASSWORD=yourpassword
DB_PORT=5432
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
