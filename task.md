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