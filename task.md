## University Mentorship Platform – Task Breakdown

This document tracks the implementation tasks for the project, chunked into logical phases.  
Each chunk includes backend, frontend, and testing/documentation work.

---

## Chunk 1 – Project & Infrastructure Setup

**Goal:** Basic backend and frontend skeletons, ready for feature work.

- [✅] **Backend – Setup**
  - [  ] Initialize `backend` Node.js project with `package.json`.
  - [ ] Add Express app (`app.js`) with a simple `/health` route.
  - [ ] Add `server.js` that creates the HTTP server and listens on `process.env.PORT || 4000`.
  - [ ] Add basic middleware: JSON body parser, CORS (allow localhost frontend).
  - [ ] Set up basic project structure: `routes/`, `controllers/`, `services/`, `middleware/`, `config/`.

- [✅] **Backend – Testing**
  - [ ] Install Jest (or preferred test runner) and configure for `backend`.
  - [ ] Write a test for `/health` returning 200.
  - [ ] Add `npm test` script in `backend/package.json`.

- [✅] **Frontend – Setup**
  - [ ] Initialize `frontend` React app (Vite or CRA) with Tailwind CSS.
  - [ ] Set up base routing shell (React Router) with placeholder pages.
  - [ ] Confirm dev builds run for both frontend and backend.

---

## Chunk 2 – Supabase Integration, Auth & Roles

**Goal:** Users can register/login via Supabase, with roles stored in `user_profiles`.

- [✅] **Supabase – Schema**
  - [ ] Create `user_profiles` table:
    - `id` (UUID, PK, references `auth.users.id`)
    - `role` (`student` | `mentor` | `admin`)
    - `full_name`, `created_at`, `updated_at`
  - [ ] (Optional) Seed one `admin` user manually in Supabase for testing.

- [✅] **Backend – Auth Integration**
  - [ ] Add Supabase JS client and config module.
  - [ ] Implement auth middleware reading Supabase JWT and attaching `req.user`.
  - [ ] Implement `/api/auth/me` to return current user profile + role.
  - [ ] Implement `/api/auth/complete-registration`:
    - [ ] Validate `desired_role` (`student` or `mentor`).
    - [ ] Enforce: mentor role only if email ends with `@mumail.ie`.
    - [ ] Create `user_profiles` row with correct role.
    - [ ] For mentors: create `mentor_profiles` with `is_approved = false`.

- [✅] **Frontend – Auth UI**
  - [ ] Set up Supabase client in frontend.
  - [ ] Implement `/register` page (role selection + email/password sign-up).
  - [ ] Implement `/login` page.
  - [ ] After sign-up, call `/api/auth/complete-registration`.
  - [ ] Implement basic auth context or hook to track logged-in user and role.
  - [ ] Implement simple protected route wrapper (redirect if not logged in).

- [ ] **Tests**
  - [ ] Backend: unit tests for auth middleware (valid, invalid, missing token).
  - [ ] Backend: tests for `/api/auth/complete-registration`:
    - [ ] Reject mentor registration without `@mumail.ie`.
    - [ ] Accept mentor registration with `@mumail.ie`.
    - [ ] Create correct `user_profiles` rows.
  - [ ] Frontend: tests for login/registration validation (required fields, invalid email).

---

## Chunk 3 – Profile Management (Student & Mentor)

**Goal:** Users can create and edit their own profiles.

- [ ] **Supabase – Schema**
  - [ ] Create `student_profiles` table:
    - `user_id` (PK, FK to `user_profiles.id`)
    - `course_program`, `interests` (e.g. `text[]`)
  - [ ] Create `mentor_profiles` table:
    - `user_id` (PK, FK)
    - `bio`, `expertise` (text or `text[]`)
    - `availability_status` (`available` | `busy` | `offline`)
    - `photo_url`
    - `average_rating`, `rating_count`
    - `is_approved` (boolean, default false)

- [ ] **Backend – Profile APIs**
  - [ ] `/api/profiles/me` GET/PUT for base profile (`full_name` etc.).
  - [ ] `/api/students/me` GET/PUT for student profile.
  - [ ] `/api/mentors/me` GET/PUT for mentor profile.
  - [ ] Ensure only the authenticated user can access/update their own profile.

- [ ] **Frontend – Profile Pages**
  - [ ] `/profile` page with:
    - [ ] Base info (name, role).
    - [ ] Student tab (course/program, interests).
    - [ ] Mentor tab (bio, expertise, availability status, profile photo).
  - [ ] Forms with inline validation and clear error messages.

- [ ] **Tests**
  - [ ] Backend: tests for profile endpoints (auth required, only owner can update).
  - [ ] Backend: validation tests (e.g., missing `full_name`).
  - [ ] Frontend: tests for profile form validation (required fields, basic data types).

---

## Chunk 4 – Mentor Discovery

**Goal:** Students can browse and view mentors with basic info and approval check.

- [ ] **Backend – Mentor Discovery APIs**
  - [ ] `/api/mentors` GET:
    - [ ] List only `mentor_profiles` where `is_approved = true`.
    - [ ] Support filters: `expertise`, `availability_status`.
    - [ ] Include `average_rating`, `rating_count`.
  - [ ] `/api/mentors/:id` GET:
    - [ ] Mentor details (profile+base profile) plus ratings and basic availability summary.

- [ ] **Frontend – Mentor List & Detail**
  - [ ] `/mentors` page:
    - [ ] Display mentor cards (name, expertise, rating).
    - [ ] Filter controls (expertise, availability).
  - [ ] `/mentors/:id` page:
    - [ ] Show detailed mentor profile and rating.
    - [ ] Placeholder for availability slots and reviews (to be filled in later).

- [ ] **Tests**
  - [ ] Backend: tests for `/api/mentors` filters and `is_approved` constraint.
  - [ ] Backend: test `/api/mentors/:id` returns expected shape and 404 for missing mentor.
  - [ ] Frontend: test mentor filtering behavior on the list page.

---

## Chunk 5 – Real-Time Chat (Conversations & Messages)

**Goal:** One-to-one mentor–student chat with persistence.

- [ ] **Supabase – Schema**
  - [ ] `conversations` table with:
    - `id`, `mentor_id`, `student_id`
    - Unique (`mentor_id`, `student_id`) constraint.
  - [ ] `messages` table with:
    - `id`, `conversation_id`, `sender_id`, `content`, `created_at`.

- [ ] **Backend – Chat APIs**
  - [ ] `/api/chat/conversations` GET: list conversations for current user.
  - [ ] `/api/chat/conversations/:id/messages` GET: paginated message history.
  - [ ] Service methods to:
    - [ ] Create or fetch conversation between mentor & student.
    - [ ] Persist new messages.

- [ ] **Backend – Socket.IO**
  - [ ] Configure Socket.IO on the server and attach auth middleware (Supabase JWT).
  - [ ] On connection: verify user and join rooms for their conversations.
  - [ ] Events:
    - [ ] `message:send` (validate sender belongs to conversation, save to DB, emit to room).
    - [ ] `message:receive` (client-side consumption).

- [ ] **Frontend – Chat UI**
  - [ ] `/chat` page with:
    - [ ] Sidebar listing conversations.
    - [ ] Main panel showing selected conversation.
  - [ ] `/chat/:conversationId` route:
    - [ ] Fetch historical messages via REST.
    - [ ] Connect to Socket.IO, join room, send/receive messages in real time.
    - [ ] Auto-scroll on new messages.

- [ ] **Tests**
  - [ ] Backend: unit tests for message service (ownership checks, ordering).
  - [ ] Backend: integration test for creating a message and retrieving it.
  - [ ] Frontend: test message list rendering and new-message append behavior (using mocked Socket.IO).

---

## Chunk 6 – Availability & Booking (with Email Notifications)

**Goal:** Mentors define slots; students book slots; system prevents double booking and sends emails.

- [ ] **Supabase – Schema**
  - [ ] `availability_slots` table:
    - `id`, `mentor_id`, `date`, `start_time`, `end_time`, `is_booked`, `created_at`.
    - Unique index on (`mentor_id`, `start_time`, `end_time`).
  - [ ] `bookings` table:
    - `id`, `slot_id` (unique FK), `student_id`, `status`, `created_at`.

- [ ] **Backend – Availability & Booking APIs**
  - [ ] `/api/availability/slots` POST (mentor): create slot(s).
  - [ ] `/api/availability/slots` GET:
    - [ ] Mentor: list own slots.
    - [ ] Student: list by `mentor_id`.
  - [ ] `/api/availability/slots/:id` PUT/DELETE (mentor): update or delete slot.
  - [ ] `/api/bookings` POST (student):
    - [ ] Transactionally mark slot as booked and create booking.
    - [ ] Prevent double booking.
  - [ ] `/api/bookings/mine` GET (student & mentor): list user’s bookings.

- [ ] **Backend – Email Service**
  - [ ] Configure Nodemailer with SMTP/SES.
  - [ ] Implement email service to:
    - [ ] Send booking confirmation to mentor and student.
    - [ ] Attach simple `.ics` file representing the booking slot.

- [ ] **Frontend – Availability & Booking UI**
  - [ ] Mentor:
    - [ ] Manage slots page (create/update/delete slots).
  - [ ] Student:
    - [ ] On mentor detail page: view available slots and book one.
    - [ ] `/bookings` page: list own bookings.

- [ ] **Tests**
  - [ ] Backend: test double-booking prevention via concurrent booking attempts.
  - [ ] Backend: validation tests on slot creation (time range, future date).
  - [ ] Backend: mocked Nodemailer tests verifying correct email fields.
  - [ ] Frontend: tests for booking form validation and slot state updates.

---

## Chunk 7 – Reviews & Ratings

**Goal:** Students can review mentors; ratings are aggregated and displayed.

- [ ] **Supabase – Schema**
  - [ ] `reviews` table:
    - `id`, `mentor_id`, `student_id`, `rating`, `comment`, `created_at`, `is_visible`.
    - Check constraint for `rating` between 1 and 5.

- [ ] **Backend – Reviews APIs**
  - [ ] `/api/reviews` POST (student-only):
    - [ ] Validate rating (1–5).
    - [ ] Optionally verify the student had a booking with that mentor.
    - [ ] Insert review.
    - [ ] Update mentor’s `average_rating` and `rating_count`.
  - [ ] `/api/mentors/:id/reviews` GET:
    - [ ] List only `is_visible = true` reviews.

- [ ] **Frontend – Review UI**
  - [ ] On mentor detail page:
    - [ ] Review form (rating + optional comment).
    - [ ] Reviews list with rating stars and text.

- [ ] **Tests**
  - [ ] Backend: tests for review creation (role, rating bounds, access rules).
  - [ ] Backend: tests for rating aggregation across multiple reviews.
  - [ ] Frontend: test review form validation and display of ratings.

---

## Chunk 8 – Admin Module (Mentor Approval & Review Moderation)

**Goal:** Admin can approve mentors and hide inappropriate reviews.

- [ ] **Backend – Admin APIs**
  - [ ] `/api/admin/mentors/pending` GET: list mentors with `is_approved = false`.
  - [ ] `/api/admin/mentors/:id/approve` POST: set `is_approved = true`.
  - [ ] `/api/admin/reviews` GET: list recent reviews.
  - [ ] `/api/admin/reviews/:id/hide` POST: set `is_visible = false`.
  - [ ] Role middleware: ensure only `role = 'admin'` can call these endpoints.

- [ ] **Frontend – Admin UI**
  - [ ] `/admin` dashboard:
    - [ ] Pending mentors table with approve button.
    - [ ] Reviews table with hide button.

- [ ] **Tests**
  - [ ] Backend: ensure non-admin users receive 403 on admin routes.
  - [ ] Backend: tests for approval and moderation behavior.
  - [ ] Frontend: simple tests to ensure admin-only components are hidden for non-admin roles (using mocked auth context).

---

## Chunk 9 – Hardening, Documentation & Deployment

**Goal:** Make the system robust, documented, and deployed.

- [ ] **Security & Reliability**
  - [ ] Review and tighten validation across all endpoints.
  - [ ] Confirm all role checks and RLS policies match requirements.
  - [ ] Ensure chats, bookings, and reviews behave correctly under edge cases.

- [ ] **Documentation**
  - [ ] Root `README.md`: project overview, architecture, setup, and run instructions.
  - [ ] `backend/README.md`: API overview, environment variables, testing commands.
  - [ ] `frontend/README.md`: routes, env vars, build/deploy commands.
  - [ ] `backend/docs/api.md`: endpoint list with request/response examples.
  - [ ] Add brief description of AWS + Supabase deployment architecture.

- [ ] **Deployment**
  - [ ] Configure AWS backend (e.g. Elastic Beanstalk) and environment variables.
  - [ ] Configure frontend hosting (Amplify or S3+CloudFront).
  - [ ] Point frontend to backend API base URL.
  - [ ] Test production environment end-to-end.

- [ ] **Final Testing**
  - [ ] Run full backend test suite.
  - [ ] Run frontend test suite.
  - [ ] Execute manual E2E scenarios:
    - [ ] Student registration → profile → mentor discovery → booking → chat → review.
    - [ ] Mentor registration (`@mumail.ie`) → admin approval → slot creation → session.
    - [ ] Admin approval and review moderation flow.

---
---

What's DONE (Completed)
Backend
Project skeleton with Express (app.js + server.js)
Health check endpoint (GET /health)
Supabase admin client configuration
Auth middleware (requireAuth) — validates Supabase JWTs
GET /api/auth/me — returns user profile + mentor approval status
POST /api/auth/complete-registration — creates user_profiles row, auto-assigns role by email domain (@mumail.ie = mentor), creates mentor_profiles row for mentors
University email utility (isUniversityEmail)
Tests: health check (1), complete-registration (5), email utility (10) — 16 tests total
Frontend
Full project setup (Vite + React + TypeScript + Tailwind + Shadcn/UI)
Beautiful landing page with scroll animations, animated counters, floating icons, gradient text
Dark mode (ThemeProvider + ThemeToggle) — fully working
Login page — real Supabase signInWithPassword()
Register page — real Supabase signUp() + calls backend complete-registration
AuthContext — real Supabase session management + profile fetching
ProtectedRoute — real route guard using auth session
Supabase client + API helpers (api.ts)
All page shells exist with polished UI (Dashboard, MentorsList, MentorDetail, Profile, Bookings, Chat, Admin, NotFound)
Database (Supabase)
user_profiles table (id, full_name, role)
mentor_profiles table (user_id, is_approved)
Supabase Auth (email/password) with 3 existing users
What's BROKEN / Disconnected
Issue	Details
Every page after login uses mock data	Dashboard, MentorsList, MentorDetail, Profile, Bookings, Chat, Admin all import from mockData.ts instead of calling APIs
Navbar shows mock user	Displays hardcoded "Alex Murphy" instead of the real logged-in user
Navbar logout does nothing	The logout button has no onClick handler
"Book" button is a no-op	MentorDetail's booking button has no handler
Profile save is fake	Just shows "Changes saved" for 3 seconds, no API call
Chat is local-state only	Messages aren't persisted, no WebSocket
Admin actions are local-state only	Approve/Hide only modify React state
No role-based authorization	Backend has no requireAdmin or requireMentor middleware
No backend routes beyond auth	No mentor, booking, chat, review, or admin endpoints
Pending Tasks (Ordered by Priority)
Based on your task.md chunks, here's the work remaining broken into actionable subtasks:

Phase 1: Wire Up Existing UI to Real Auth (Quick Wins)
These require NO new backend routes — just connect pages to the already-working auth:

Update Navbar to use real auth — Replace currentUser mock import with useAuth() hook. Show the real user's name/initials. Wire the Logout button to signOut(). Show Admin link based on real role.
Update Dashboard to use real user identity — Replace mock currentUser with useAuth() profile for the welcome message and role-based view switching.
Update Profile page to use real user data — Pre-fill form from useAuth() profile instead of mock data.
Phase 2: Profile Management (Chunk 3)
Create Supabase schema — Add student_profiles table (user_id, course_program, interests). Expand mentor_profiles with bio, expertise, availability_status, photo_url, average_rating, rating_count.
Backend: Profile APIs — GET/PUT /api/profiles/me, GET/PUT /api/students/me, GET/PUT /api/mentors/me with ownership checks.
Frontend: Connect Profile page — Replace mock form with real API calls. Save changes via PUT to the backend.
Tests — Backend profile endpoint tests. Frontend form validation tests.
Phase 3: Mentor Discovery (Chunk 4)
Backend: Mentor listing API — GET /api/mentors (only is_approved = true, support expertise/availability filters). GET /api/mentors/:id for detail.
Frontend: Connect MentorsList — Replace mock mentors array with API call. Wire up search/filter to query params.
Frontend: Connect MentorDetail — Fetch mentor by ID from API instead of mock data.
Tests — Filter tests, is_approved constraint, 404 handling.
Phase 4: Availability & Booking (Chunk 6)
Supabase schema — Create availability_slots table and bookings table.
Backend: Availability APIs — CRUD for slots (POST/GET/PUT/DELETE /api/availability/slots).
Backend: Booking API — POST /api/bookings with transactional double-booking prevention. GET /api/bookings/mine.
Backend: Email service — Nodemailer setup for booking confirmation emails with .ics attachment.
Frontend: Connect Bookings page — Replace mock bookings with API. Wire mentor slot creation form to API.
Frontend: Connect MentorDetail "Book" button — Actually create a booking via API.
Tests — Double-booking prevention, slot validation, email mocking.
Phase 5: Real-Time Chat (Chunk 5)
Supabase schema — Create conversations and messages tables.
Backend: Chat REST APIs — GET /api/chat/conversations, GET /api/chat/conversations/:id/messages.
Backend: Socket.IO — Real-time message delivery with JWT auth, room-based messaging.
Frontend: Connect Chat page — Fetch conversations/messages from API. Connect Socket.IO for real-time send/receive.
Tests — Message ownership, ordering, Socket.IO events.
Phase 6: Reviews & Ratings (Chunk 7)
Supabase schema — Create reviews table (mentor_id, student_id, rating 1-5, comment, is_visible).
Backend: Reviews API — POST /api/reviews (student-only, validate rating). GET /api/mentors/:id/reviews. Update mentor's average_rating on each review.
Frontend: Review form on MentorDetail — Star rating picker + comment. Display reviews list.
Tests — Rating bounds, role check, aggregation.
Phase 7: Admin Module (Chunk 8)
Backend: Role middleware — requireAdmin middleware that checks profile.role === "admin".
Backend: Admin APIs — GET /api/admin/mentors/pending, POST /api/admin/mentors/:id/approve, GET /api/admin/reviews, POST /api/admin/reviews/:id/hide.
Frontend: Connect Admin page — Replace mock data with API calls. Approve/Hide trigger real backend operations.
Tests — 403 for non-admins, approval/moderation behavior.
Phase 8: Hardening & Deployment (Chunk 9)
Security review — Tighten validation, add RLS policies in Supabase, review all role checks.
Documentation — Root README (update), backend API docs, frontend docs.
Deployment — AWS backend (Elastic Beanstalk), frontend hosting (Amplify/S3+CloudFront), env var config.
E2E testing — Full flow tests: student registration through review, mentor flow, admin flow.
Suggestions & Add-ons
Notification system — Toast notifications when a booking is confirmed, a new chat message arrives, or a mentor is approved. You already have the Shadcn toast infrastructure.

Email confirmation flow — Your Supabase has email confirmation enabled. Add a proper "verify your email" landing page that handles the Supabase confirmation redirect callback.

Mentor approval email — When an admin approves a mentor, send them an email notification via Nodemailer.

Session reminders — Send email reminders 24 hours and 1 hour before a booked session.

Search with debounce — Add debounced search on the MentorsList page so it doesn't re-filter on every keystroke.

Pagination — The mentor list and chat messages should use cursor-based pagination as data grows.

Profile completion guard — After login, if profileExists === false, redirect to a profile completion page before allowing access to the dashboard. Your AuthContext already returns this flag.

Loading skeletons — Use the Shadcn Skeleton component (you already have it) to show loading states while data fetches from APIs.

Typing indicator in chat — A simple Socket.IO event showing when the other person is typing.

Export booking to calendar — Generate .ics files that users can add to Google Calendar/Outlook.

Rate limiting — Add Express rate limiting middleware to prevent abuse on auth and booking endpoints.

PWA support — Add a service worker and manifest for installable mobile experience, since your UI is already fully responsive.

Priority recommendation
Start with Phase 1 (items 1-3) — it's the quickest win since it requires zero new backend code and immediately makes your app feel "real" after login. Then proceed with Phases 2-4 which form the core functionality. Chat (Phase 5) and Reviews (Phase 6) can be done in parallel if you're short on time.