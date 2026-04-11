# MentorConnect — University Mentorship Platform

A full-stack web application that connects university students with academic and industry mentors. Students can discover mentors, book one-on-one sessions, chat in real-time, and leave reviews.

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, TypeScript, Tailwind CSS  |
| UI         | Radix UI, Shadcn/ui, Lucide Icons   |
| Backend    | Node.js, Express                    |
| Database   | Supabase (PostgreSQL)               |
| Auth       | Supabase Auth                       |
| Testing    | Vitest, Playwright                  |

## Features

- **Student Dashboard** — View upcoming bookings and active conversations
- **Mentor Discovery** — Search and filter mentors by expertise and availability
- **Session Booking** — Book available time slots directly from mentor profiles
- **Real-Time Chat** — Message mentors before and after sessions
- **Profile Management** — Students and mentors can manage their profiles
- **Admin Panel** — Approve mentor applications and moderate reviews
- **Responsive Design** — Works across mobile, tablet, and desktop
- **Dark Mode** — (Coming soon)

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A Supabase project (URL and keys in `frontend/.env` and `backend/.env` — copy from each folder’s `.env.example`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in Supabase and optional SMTP settings
npm run dev
```

The Vite dev server proxies API and Socket.IO to the backend port (see `frontend/vite.config.ts` and `backend/.env.example`).

Database migrations live under `supabase/migrations/`; apply them in your Supabase project as documented in `supabase/migrations/README.md`.

## Author

Priyanshu Chatterjee — Maynooth University
