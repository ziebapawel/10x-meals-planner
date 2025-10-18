# Authentication Module Technical Specification

This document outlines the architecture for implementing user authentication (registration, login, logout, and password recovery) in the Meals Planner application, based on the requirements in `prd.md`.

## 1. UI Architecture

The frontend will be updated to support authentication flows, separating public and protected content. The changes will involve creating new pages and components, and updating the main layout.

### 1.1. Layouts

#### `src/layouts/Layout.astro`

The main layout will be enhanced to manage user session state and conditionally render UI elements.

- **Responsibilities**:
  - Check for an active user session from `Astro.locals.session`.
  - Render a user-aware navigation bar:
    - **Authenticated State**: Display a "Logout" button and potentially a link to a user profile page.
    - **Unauthenticated State**: Display "Login" and "Register" buttons.
  - Pass the session status down to child pages and components as needed.

### 1.2. Pages (Astro)

New pages will be created to host the authentication forms. These pages will be responsible for server-side rendering of the page shell and importing the interactive React components.

#### `src/pages/login.astro`

- **Route**: `/login`
- **Purpose**: Displays the login form for existing users.
- **Logic**:
  - If the user is already authenticated, it should redirect to the homepage (`/`).
  - Renders the `LoginForm` React component.

#### `src/pages/register.astro`

- **Route**: `/register`
- **Purpose**: Displays the registration form for new users.
- **Logic**:
  - If the user is already authenticated, it should redirect to the homepage (`/`).
  - Renders the `RegisterForm` React component.

### 1.3. Components (React)

Interactive forms will be built as client-side React components to handle state, validation, and API interactions.

#### `src/components/auth/LoginForm.tsx`

- **Purpose**: Handles user login.
- **State Management**:
  - `email`, `password`
  - `isLoading`, `error`
- **Validation (Client-Side)**:
  - Email must be a valid format.
  - Password must not be empty.
- **Actions**:
  - On submit, it makes a `POST` request to the `/api/auth/login` endpoint.
  - On success, it redirects the user to the homepage (`/`).
  - On failure, it displays an error message (e.g., "Invalid credentials").

#### `src/components/auth/RegisterForm.tsx`

- **Purpose**: Handles new user registration.
- **State Management**:
  - `email`, `password`, `confirmPassword`
  - `isLoading`, `error`
- **Validation (Client-Side)**:
  - Email must be a valid format.
  - Password must meet minimum length requirements (e.g., 8 characters).
  - `password` and `confirmPassword` must match.
- **Actions**:
  - On submit, it makes a `POST` request to the `/api/auth/register` endpoint.
  - On success, it redirects the user to the homepage (`/`), effectively logging them in.
  - On failure, it displays an error message (e.g., "Email already in use").

## 2. Backend Logic

Backend logic will be implemented using Astro API routes, which will serve as the bridge between the frontend and the Supabase authentication service.

### 2.1. API Endpoints (`src/pages/api/auth/`)

All endpoints will use the Supabase Server-Side-Rendering (SSR) client to securely handle authentication and session management.

#### `POST /api/auth/register`

- **Request Body**: `{ email: string, password: string }`
- **Logic**:
  1.  Validate input using a schema (e.g., with Zod).
  2.  Call `supabase.auth.signUp()` with the provided credentials.
  3.  If successful, the Supabase client will handle setting the auth cookie.
  4.  Return a `200 OK` response.
  5.  Handle errors (e.g., user already exists) and return appropriate status codes (`409 Conflict`).

#### `POST /api/auth/login`

- **Request Body**: `{ email: string, password: string }`
- **Logic**:
  1.  Validate input.
  2.  Call `supabase.auth.signInWithPassword()`.
  3.  If successful, the Supabase client handles setting the auth cookie.
  4.  Return a `200 OK` response.
  5.  Handle errors (e.g., invalid credentials) and return `401 Unauthorized`.

#### `POST /api/auth/logout`

- **Request Body**: None
- **Logic**:
  1.  Call `supabase.auth.signOut()`.
  2.  The Supabase client handles clearing the auth cookie.
  3.  Return a `200 OK` response.

#### `GET /api/auth/callback`

- **Purpose**: Required by Supabase for server-side auth flow, specifically after email confirmation or OAuth login.
- **Logic**:
  1.  Handles the code exchange from the URL query parameters.
  2.  Calls `supabase.auth.exchangeCodeForSession()`.
  3.  Redirects the user to a protected page (e.g., homepage).

### 2.2. Data Validation

- A shared schema file, e.g., `src/lib/validation/auth.schemas.ts`, will be created to define Zod schemas for all auth-related data structures (`loginSchema`, `registerSchema`, etc.).
- These schemas will be used for both client-side and server-side validation to ensure consistency.

## 3. Authentication System

The core of the authentication system will be Supabase Auth, integrated into the Astro application using middleware and the `@supabase/ssr` library.

### 3.1. Supabase Integration

- **Library**: `@supabase/ssr` will be used to create server and client Supabase clients.
- **Environment Variables**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` will be securely stored and used to initialize the clients.

### 3.2. Astro Middleware

A middleware file at `src/middleware/index.ts` will be created to manage sessions on every request.

- **On each request**:
  1.  It will initialize the Supabase server client using the cookies from the incoming request.
  2.  It will attempt to retrieve the current session using `supabase.auth.getSession()`.
  3.  The session object and user data will be stored in `Astro.locals`, making it accessible in all server-side code (Astro pages, layouts, API endpoints). `Astro.locals.session = session; Astro.locals.user = user;`
  4.  It will handle the session cookie update logic as recommended by `@supabase/ssr`.
- **Route Protection**:
  - The middleware will check the current path.
  - If the user tries to access a protected route (e.g., `/dashboard`, `/meal-plans`) without a valid session, they will be redirected to `/login`.
  - The homepage (`/`) will be accessible to both authenticated and unauthenticated users, but its content might change based on the session state.

### 3.3. Server-Side Rendering (`astro.config.mjs`)

The existing configuration `output: "server"` and the `@astrojs/node` adapter are correctly set up for this architecture. The server-side nature allows the middleware to run on every request, enabling secure and stateful user sessions. No changes are needed in `astro.config.mjs`.
