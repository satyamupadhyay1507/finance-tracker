# Task Board - Full Stack Application

A clean, production-ready Task Board application built with **Next.js (App Router)**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**.

Users can register an account, log in securely, create tasks with initial statuses, view their personalized task list, and update task statuses in real-time.

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router, Server Components & Route Handlers)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Authentication:** Custom JWT session management stored in `HttpOnly` cookies
- **Password Hashing:** `bcryptjs`
- **Validation:** Zod schema validation
- **Styling:** Tailwind CSS & Lucide Icons

---

## 🔐 Authentication Flow Explanation

1. **User Signup (`POST /api/auth/signup`):**
   - User inputs email, password, and optional name.
   - The password is securely hashed server-side using `bcryptjs` (salt rounds: 10).
   - A new `User` record is created in PostgreSQL via Prisma.
   - A JSON Web Token (JWT) signed with `HS256` via `jose` is generated.
   - The token is attached to the HTTP response as a `SameSite=Lax`, `HttpOnly` cookie named `auth_session`.

2. **User Login (`POST /api/auth/login`):**
   - Credentials are submitted and validated against the database.
   - Password validity is verified using `bcrypt.compare`.
   - Upon verification, an `HttpOnly` session cookie is set.

3. **Session Verification (`GET /api/auth/me`):**
   - Protected API routes and pages verify the `auth_session` cookie server-side.
   - This ensures full XSS protection since client-side JavaScript cannot read `HttpOnly` session tokens.

4. **Logout (`POST /api/auth/logout`):**
   - Clears the `auth_session` cookie immediately.

---

## 🗄 Database Schema Explanation

The application uses a clean relational schema with a 1-to-many relationship between `User` and `Task`.

### Entity Relationship Diagram (ERD)

```
+--------------------------------+       +--------------------------------+
|              USER              |       |              TASK              |
+--------------------------------+       +--------------------------------+
| id        : String (PK, CUID)  | 1   N | id        : String (PK, CUID)  |
| email     : String (Unique)    |<----->| title     : String             |
| password  : String (Hashed)    |       | status    : Enum (TODO/...)    |
| name      : String?            |       | userId    : String (FK)        |
| createdAt : DateTime           |       | createdAt : DateTime           |
| updatedAt : DateTime           |       | updatedAt : DateTime           |
+--------------------------------+       +--------------------------------+
```

### Prisma Schema Definitions

```prisma
enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Task {
  id        String     @id @default(cuid())
  title     String
  status    TaskStatus @default(TODO)
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([userId])
}
```

---

## 🚀 Steps to Run Locally

### 1. Prerequisites
- Node.js (v18.x or later)
- PostgreSQL database (Local instance or free cloud database on Neon/Supabase)

### 2. Environment Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/satyamupadhyay1507/finance-tracker.git task-board
cd task-board
npm install
```

Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/taskboard?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key"
```

### 3. Database Migration & Prisma Setup
Generate the Prisma client and push the schema to your database:
```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server
Start the local Next.js server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to test the app.

---

## 🌐 Live URL

- **Production Deployment:** [https://finance-tracker-green-six.vercel.app](https://finance-tracker-green-six.vercel.app) *(or updated Vercel deployment link)*
