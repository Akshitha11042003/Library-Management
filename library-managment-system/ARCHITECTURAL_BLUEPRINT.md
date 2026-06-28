# Software Architecture & Implementation Blueprint: Library Management System Backend

This document details the production-ready, highly secure, and enterprise-grade software architecture for the **Library Management System (LMS) Backend**. Designed from the perspective of a Senior Backend Architect, it focuses on high concurrency, clean separation of concerns, robust security, strict database integrity, and ease of scaling.

---

## 1. Overall System Architecture

The Library Management System is designed around a **Clean, Layered Architecture** (often referred to as an N-Tier architecture). This decouples the network/transport layer, business rule validation, core application logic, data persistence, and cross-cutting concerns (logging, security, validation).

```
   ┌─────────────────────────────────────────────────────────┐
   │                     Client Tier                         │
   │            (Web, Mobile, External Services)             │
   └────────────────────────────┬────────────────────────────┘
                                │ HTTPS Requests
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                    API Gateway / Nginx                  │
   │        (Rate Limiting, SSL Termination, Reverse Proxy)  │
   └────────────────────────────┬────────────────────────────┘
                                │ 
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                     Express App                         │
   │                                                         │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │              Security & Global Middleware         │  │
   │  │   (Helmet, CORS, Rate Limiters, JSON Parsers)     │  │
   │  └─────────────────────────┬─────────────────────────┘  │
   │                            │                            │
   │                            ▼                            │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │                    Routing Layer                  │  │
   │  │     (Express Routes mapping URI endpoints)        │  │
   │  └─────────────────────────┬─────────────────────────┘  │
   │                            │                            │
   │                            ▼                            │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │            Request Validation Middleware          │  │
   │  │         (express-validator JSON schema validation)│  │
   │  └─────────────────────────┬─────────────────────────┘  │
   │                            │                            │
   │                            ▼                            │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │            Auth & RBAC Middleware                 │  │
   │  │         (JWT Verification, Role Authorization)    │  │
   │  └─────────────────────────┬─────────────────────────┘  │
   │                            │                            │
   │                            ▼                            │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │                 Controller Layer                  │  │
   │  │      (Request parsing, Response serialization)     │  │
   │  └─────────────────────────┬─────────────────────────┘  │
   │                            │                            │
   │                            ▼                            │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │                  Service Layer                    │  │
   │  │      (Transaction management, Business rules)     │  │
   │  └─────────────────────────┬─────────────────────────┘  │
   │                            │                            │
   │                            ▼                            │
   │  ┌───────────────────────────────────────────────────┐  │
   │  │               Database Access / ORM               │  │
   │  │          (Prisma Client / Connection Pool)        │  │
   │  └─────────────────────────┬─────────────────────────┘  │
   └────────────────────────────┼────────────────────────────┘
                                │ SQL Queries (Prisma Engine)
                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │                 Database Tier (MySQL)                   │
   │         (Primary Instance + Optional Read Replicas)     │
   └─────────────────────────────────────────────────────────┘
```

### Architectural Quality Attributes
* **Maintainability & Decoupling**: Each layer has a singular responsibility. Controllers do not run raw SQL or handle transactions; services do not know about HTTP headers or Express request objects.
* **Transaction Safety**: Business processes that modify multiple database entities (e.g., borrowing a book updates book inventory and creates a borrow record) are wrapped in **atomic database transactions** within the Service Layer.
* **Auditability & Traceability**: Standardized logging hooks and a central correlation ID system trace every request's lifecycle.

---

## 2. Layered Architecture Deep Dive

Each request navigates a unidirectional flow through highly specialized, isolated layers.

### A. Routes
* **Role**: Define application endpoints, bind URI paths to specific HTTP verbs, and sequence the execution of route-specific middlewares.
* **Architectural Boundaries**: Absolutely zero business logic. They act purely as a registry and orchestration pipeline:
  ```
  Route Path -> Global/Auth Middlewares -> Validation Middleware -> Controller Action
  ```

### B. Controllers
* **Role**: Serve as the entrance gate to the application's business engine. They handle HTTP-specific mechanics.
* **Responsibilities**:
  * Extract route params, query variables, and request body.
  * Verify validation flags (forwarded from middleware).
  * Delegate payload parsing to the target service.
  * Format and serialize HTTP responses using the **API Response Standard**.
  * Catch any thrown service errors and forward them directly to the `next()` middleware handler.
* **Boundaries**: Controllers *must not* execute database queries or perform raw validation checks. They are strictly HTTP-aware wrappers around service logic.

### C. Services
* **Role**: Implement the core domain logic, invariants, and workflows of the Library Management System.
* **Responsibilities**:
  * Implement calculations, state updates, and business validation (e.g., checking if a user has exceeded their borrowing limit, or if a book is out of stock).
  * Manage transactional boundaries (`prisma.$transaction`) to prevent dirty reads or split-state bugs under heavy concurrent borrowing.
  * Interact with the database abstraction layer to query or mutate state.
* **Boundaries**: Services are entirely HTTP-agnostic. They receive clean, validated primitives (strings, numbers, objects) and return typed records or custom domain structures. They can be fully tested in isolation without spawning an Express server or mocking requests.

### D. Middleware
* **Role**: Provide centralized, reusable logic that intercepts requests before they hit controllers.
* **Categories**:
  * **Global Non-functional**: `helmet`, `cors`, `express.json()`, `rateLimiter`.
  * **Security**: Token parsing, signature validation, and user identity extraction.
  * **Role-Based Access Control (RBAC)**: Validates authorization permissions based on JWT payloads.
  * **Input Validation**: Express-validator pipelines that reject malformed bodies.
  * **Global Error Handler**: Catches all downstream exceptions, logs them with stack traces securely (never exposing them to client), and sanitizes the output.

### E. Database Layer
* **Role**: Ensure highly structured, performant, and durable persistent storage.
* **Framework**: **Prisma ORM** interacting with a **MySQL** cluster.
* **Responsibilities**:
  * Auto-generate safe SQL query builders via Prisma.
  * Manage connection pooling (reusing database connections instead of instantiating new connections per request).
  * Maintain referential integrity, unique index constraints, and cascading rules.

### F. Utilities
* **Role**: Cross-cutting helper functions without business state.
* **Examples**: JWT generation and signing algorithms, cryptographic hash wrapping, centralized error helper constructors (e.g., `AppError`), and custom structured log formatters.

---

## 3. Folder Structure

Below is the production-grade folder structure designed for strict separation of concerns, keeping modules clean and avoiding bloated files.

```
/
├── prisma/                          # Prisma database configuration and migration files
│   ├── schema.prisma                # Core database schema definitions & indexes
│   └── migrations/                  # Version-controlled SQL migration history files
│
├── src/
│   ├── config/                      # Environment variables, database clients, & server settings
│   │   ├── db.ts                    # Prisma Client single instance export & connection pooling
│   │   └── security.ts              # Custom security rules, JWT configs, rate limit thresholds
│   │
│   ├── constants/                   # Pure constant declarations, status codes, and enum lists
│   │   └── errorCodes.ts            # Standard internal error codes for fine-grained debugging
│   │
│   ├── controllers/                 # Express controllers mapping HTTP parameters to services
│   │   ├── auth.controller.ts       # Handles signups, logins, and session terminations
│   │   ├── book.controller.ts       # Librarian book operations (CRUD)
│   │   ├── member.controller.ts     # Librarian member workflows
│   │   └── borrow.controller.ts     # Member borrow/return actions and history tracking
│   │
│   ├── middlewares/                 # Middleware interceptors executing sequentially
│   │   ├── auth.middleware.ts       # JWT authentication validator and payload decoder
│   │   ├── role.middleware.ts       # Generic role-based access controller (RBAC)
│   │   ├── validation.middleware.ts # Standard express-validator evaluation middleware
│   │   ├── error.middleware.ts      # Global centralized error handler
│   │   └── rateLimiter.middleware.ts# IP-based rate limiting configurations
│   │
│   ├── routes/                      # URI maps linking end-points to middleware & controllers
│   │   ├── index.ts                 # Root router bundling all sub-routes
│   │   ├── auth.routes.ts           # Authentication sub-routes
│   │   ├── book.routes.ts           # Books resource management
│   │   ├── member.routes.ts         # Members management
│   │   └── borrow.routes.ts         # Transactions for borrow and return tracking
│   │
│   ├── services/                    # Domain Layer containing pure, transaction-aware business logic
│   │   ├── auth.service.ts          # Validates credentials, hashes passwords, generates sessions
│   │   ├── book.service.ts          # Implements inventory mutations, catalog listings
│   │   ├── member.service.ts        # Performs member profile edits, lockouts, status updates
│   │   └── borrow.service.ts        # Executes transactional book borrows and inventory checkouts
│   │
│   ├── types/                       # Shared custom types and extended Express definitions
│   │   ├── index.ts                 # Domain type declarations
│   │   └── express.d.ts             # Namespace merging to add parsed user payload to Express Request
│   │
│   ├── utils/                       # Common stateless helper libraries
│   │   ├── AppError.ts              # Standard operational exception constructor
│   │   ├── logger.ts                # Structured, level-based console/file logging utility
│   │   └── securityUtils.ts         # Encapsulates bcrypt hashing and JWT cryptographic wrappers
│   │
│   ├── app.ts                       # Setup of Express instance, middlewares, and route mounting
│   └── server.ts                    # Entry-point initializing server socket connection on port 3000
│
├── .env.example                     # Reference document outlining required environment variables
├── .gitignore                       # Explicit exclusion rules for node_modules, build caches, and secrets
├── package.json                     # Root project configuration and script listings
└── tsconfig.json                    # TypeScript compiler parameters and build instructions
```

---

## 4. Database Design

A relational database (MySQL) is chosen to handle the strict ACID compliance demands of transactional borrowing, where overlapping operations must never result in negative inventories or multiple records claiming the same physical book copy.

```
                   ┌──────────────┐
                   │     User     │
                   └──────┬───────┘
                          │ 1
                          │
                          │ 1..N
                   ┌──────▼───────┐
                   │ BorrowRecord │
                   └──────▲───────┘
                          │ 1..N
                          │
                          │ 1
                   ┌──────┴───────┐
                   │     Book     │
                   └──────────────┘
```

### Prisma Schema Definition (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  MEMBER
  LIBRARIAN
}

enum BorrowStatus {
  BORROWED
  RETURNED
  OVERDUE
}

model User {
  id           String         @id @default(uuid())
  email        String         @unique
  passwordHash String
  name         String
  role         Role           @default(MEMBER)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  borrows      BorrowRecord[]

  @@index([role])
}

model Book {
  id              String         @id @default(uuid())
  title           String
  author          String
  isbn            String         @unique
  totalCopies     Int            @default(1)
  availableCopies Int            @default(1)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  borrows         BorrowRecord[]

  @@index([title, author])
}

model BorrowRecord {
  id         String       @id @default(uuid())
  memberId   String
  bookId     String
  borrowDate DateTime     @default(now())
  dueDate    DateTime
  returnDate DateTime?
  status     BorrowStatus @default(BORROWED)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  member     User         @relation(fields: [memberId], references: [id], onDelete: Restrict)
  book       Book         @relation(fields: [bookId], references: [id], onDelete: Restrict)

  @@index([memberId, status])
  @@index([bookId, status])
}
```

### Table Explanations & Relational Philosophy

#### 1. User Table
* **Purpose**: Store identity and roles of members and librarians.
* **Fields**:
  * `id`: Standard UUIDv4 string. Guarantees non-predictable, global uniqueness (protects against sequential record enumeration attacks).
  * `email`: Lowercase, unique string constraint. A database-level index ensures lookups during login run in $O(1)$ time.
  * `role`: Enum containing `MEMBER` or `LIBRARIAN`. Evaluated by the role-based route authorizers.
* **Indexes**: Single-column index on `role` optimizes member dashboard counts and librarian administrative operations.

#### 2. Book Table
* **Purpose**: Track physical catalog volumes and running stock counts.
* **Fields**:
  * `isbn`: Internationally standardized format, enforced with a unique constraint at the DB level to block duplicate titles with conflicting details.
  * `totalCopies`: Positive integer representation of absolute holdings.
  * `availableCopies`: The real-time physical inventory count on shelves. This count decreases on borrow, increases on return, and acts as a strict inventory guard (can never drop below zero).
* **Indexes**: Composite index on `[title, author]` drastically accelerates dynamic catalog search operations.

#### 3. BorrowRecord Table
* **Purpose**: Log borrowing transactions, track due dates, and record returns.
* **Design Rationale**:
  * Relational links: Many-to-One with both `User` (as Member) and `Book`.
  * Cascading rules: Enforced with **`onDelete: Restrict`**. A user profile cannot be deleted if active borrow records refer to it. Similarly, books cannot be purged from the catalog if current records indicate copies are outstanding. This prevents orphan rows and database corruption.
  * Composite Indexes:
    * `[memberId, status]`: Essential for checking a user's outstanding loans (e.g., assessing if they have exceeded the default maximum checkout limit of 5 books).
    * `[bookId, status]`: Accelerates librarian operations to audit current holders of highly requested materials.

---

## 5. Authentication Flow

The backend implements a stateless, standard JSON Web Token (JWT) workflow utilizing cryptographic signatures.

```
Client                             Express Backend                          Database
  │                                      │                                      │
  │ 1. POST /api/auth/register           │                                      │
  ├─────────────────────────────────────►│                                      │
  │    (Name, Email, Password)           │ 2. Check if user exists              │
  │                                      ├─────────────────────────────────────►│
  │                                      │◄─────────────────────────────────────┤
  │                                      │    (No matching record)              │
  │                                      │                                      │
  │                                      │ 3. Hash Password (bcrypt, salt=12)   │
  │                                      │ 4. Persist User Record               │
  │                                      ├─────────────────────────────────────►│
  │                                      │◄─────────────────────────────────────┤
  │                                      │    (Record Created)                  │
  │◄─────────────────────────────────────┤                                      │
  │    201 Created (Success Payload)     │                                      │
  │                                      │                                      │
  │                                      │                                      │
  │ 5. POST /api/auth/login              │                                      │
  ├─────────────────────────────────────►│                                      │
  │    (Email, Password)                 │ 6. Fetch User Record                 │
  │                                      ├─────────────────────────────────────►│
  │                                      │◄─────────────────────────────────────┤
  │                                      │    (Return Hash & Role)              │
  │                                      │                                      │
  │                                      │ 7. bcrypt.compare(pass, hash)        │
  │                                      │ 8. Sign JWT (HMAC-SHA256)            │
  │                                      │    Payload: { uid, role }            │
  │◄─────────────────────────────────────┤                                      │
  │    200 OK (AccessToken in response)   │                                      │
  │                                      │                                      │
```

### Execution Details:
1. **Password Scrambling**: Enforce password parameters in the user table. Cryptographic hashing is managed with `bcrypt`, running exactly `12` salt rounds (striking an optimal balance between execution safety on hardware and raw server throughput).
2. **Payload Protection**: High security is achieved by ensuring that raw password strings are never output or logged, and database schemas use generic field definitions (`passwordHash`) to protect details in case of server dumps.
3. **Session Issuance**: Access tokens are encoded as JWTs using a robust private key signature mechanism (`HMAC-SHA256`).
4. **Token Expiry**: The backend sets access tokens to expire in exactly `15 minutes`. In production, a secure HTTP-Only cookie workflow can handle refresh tokens.

---

## 6. Authorization Flow (Role-Based Access Control)

Authorization is managed via custom middleware components structured down to individual route levels.

```
Incoming Request (Bearer Token)
  │
  ▼
[JWT Auth Middleware]
  ├── Decode Token Header & Signature Validation
  ├── Expired? ──► [Throw 401 Unauthorized]
  └── Valid payload?
        ▼
   Set Request Context: `req.user = { id: "uuid", role: "LIBRARIAN" }`
        │
        ▼
[Role-Based Authorization Middleware: `authorizeRoles("LIBRARIAN")`]
  ├── Read `req.user.role` from context
  ├── Is role permitted in allowed list?
  │     ├── NO  ──► [Throw 403 Forbidden]
  │     └── YES ──► Continue to Controller execution
  ▼
Execute Controller Handler
```

### Signature Logic
```typescript
// Example of RBAC design pattern
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("User identity not established", 401));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Insufficient access rights for this resource", 403));
    }
    
    next();
  };
};
```

* **Default Deny Strategy**: If `req.user` is not populated or the role field is empty, the middleware defaults to blocking access and throwing a `401 Unauthorized` error.

---

## 7. API Request-Response Lifecycle Flow

A step-by-step breakdown of how a network transaction moves through the system:

```
[Client App]
   │
   ▼  (Network layer over HTTPS)
[Express Server Entrypoint]
   │
   ▼  (Global Middlewares: Security/Cors/Limiter)
[URL Route Matching]
   │
   ▼  (Validator Middleware: Schema structure & Datatypes checks)
[Auth Verification & Token Decoders]
   │
   ▼  (RBAC Role Verification)
[Controller Action Handler]
   │
   ▼  (Service Layer: Core Business Logic & State Checks)
[Prisma Database Transaction]
   │
   ▼  (Data Mutated & Struct Returned to Service)
[Controller Format & Serializer]
   │
   ▼  (Formatted JSON standard)
[Client Response Sent]
```

### Processing Steps:
1. **Network Layer**: Client initiates an HTTP request over TLS (e.g., `POST /api/borrow/checkout`).
2. **Global Filters**: The application evaluates IP rate limiting and Helmet headers to prevent malicious payloads or spam.
3. **Route Matching**: Express parses the URL path and targets the endpoint group.
4. **Validation Filter**: The request runs through `express-validator` checks, instantly blocking malformed queries or JSON bodies without hitting the service layer.
5. **Session Validation**: Authentication middlewares parse the Authorization header, validating JWT format and verifying the digital signature.
6. **Authorization Filter**: Permissions checks compare roles to confirm access limits.
7. **Execution**: The Controller calls the appropriate service method.
8. **Business Execution**: The Service manages database changes in a secure transaction.
9. **Final Response**: The Controller wraps the database models in a secure JSON structure and returns it with the correct HTTP status code.

---

## 8. Validation Strategy

Input validation acts as the boundary shield protecting services from malformed values.

* **Framework**: **`express-validator`** combined with standard Express routes.
* **Declarative Schema Definitions**: Define validation rules as static middleware objects inside routes, keeping controllers and services clean.
* **Separation of Concerns**: Validation middleware decouples routing logic from parsing checks.
* **Fail-Fast Policy**: If incoming payloads fail schema validations (such as a missing password, invalid email format, or negative copy counts), the middleware blocks further processing. It returns an early `422 Unprocessable Entity` response, preventing invalid requests from wasting controller or database resources.

---

## 9. Centralized Error Handling Strategy

An elegant, resilient, and bulletproof error-handling pipeline is crucial for production systems. It guarantees that the server never crashes due to unhandled promise rejections or DB connection drops, and ensures sensitive stack traces never leak to client terminals.

### Core Architecture Components:

1. **Custom Operational Class (`AppError`)**:
   Extends the standard JavaScript `Error` class to distinguish operational errors (foreseen issues like invalid password or out-of-stock items) from programmer errors (unforeseen syntax bugs or broken database connections).

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
```

2. **Wrapper for Async Functions**:
   A utility function that wraps async Express route handlers. This automatically catches rejected promises and routes them to the central error handler, removing the need for repetitive `try-catch` blocks.

```typescript
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
```

3. **Centralized Error Middleware**:
   Processes all errors generated by the application. In production mode, it hides technical database details and stack traces, while keeping them visible in local development logs.

```typescript
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production Mode: Sanitize output and protect sensitive server logs
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: "fail",
        message: err.message,
      });
    } else {
      // Programmer error or system bug: Do not leak technical details
      console.error("CRITICAL EXCEPTION 💥:", err);
      res.status(500).json({
        status: "error",
        message: "An internal system error occurred. Please try again later.",
      });
    }
  }
};
```

---

## 10. Security Strategy

Security is baked into the architecture rather than being added as an afterthought.

| Threat | Architectural Defense Mechanism |
| :--- | :--- |
| **Brute Force & DoS** | IP-based rate limiting on sensitive authentication endpoints (`POST /api/auth/*`). |
| **Security Headers / XSS** | **Helmet.js** integration to set key security headers (e.g., disabling `X-Powered-By` to prevent framework detection, enforcing `X-Frame-Options` to block clickjacking). |
| **SQL Injection** | Prisma ORM uses **parameterized queries** for all database operations by default, completely eliminating raw string concatenation vectors. |
| **Cross-Origin Leakage** | Enforce CORS controls by validating origin access via clean white-lists. |
| **Credential Storage Compromise** | Cryptographic hashing via **bcrypt** with `12` salt rounds. Raw passwords are never stored. |
| **Broken Object-Level Authorization (BOLA)** | Authorization middleware checks requested resources against the token's decoded identity payload, preventing members from editing or reading other users' accounts. |
| **Insecure Env Settings** | Strict dotenv loader checks on startup block server boot if crucial keys (e.g., `JWT_SECRET`) are missing or fallback to unsafe defaults. |

---

## 11. Folder Dependency Diagram

This diagram maps file-level import relationships. Data flows downward, and files are strictly forbidden from importing from higher layers to prevent circular dependencies.

```
                  ┌──────────────────┐
                  │    server.ts     │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │     app.ts       │
                  └────────┬─────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌──────────────────┐                ┌──────────────────┐
│      Routes      ├───────────────►│    Middleware    │
└────────┬─────────┘                └────────┬─────────┘
         │                                   │
         ▼                                   │
┌──────────────────┐                         │
│   Controllers    │◄────────────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Services     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Prisma / DB   │
└──────────────────┘
```

---

## 12. Request Flow Diagram

This diagram traces a member requesting to borrow a book (`POST /api/borrow/checkout`).

```
Client                  Routes             Validation             Auth / RBAC           Controller            Service             Database
  │                       │                     │                      │                    │                    │                    │
  │─── POST /checkout ───►│                     │                      │                    │                    │                    │
  │                       │── Check Payload ───►│                      │                    │                    │                    │
  │                       │◄── Schema Valid ────│                      │                    │                    │                    │
  │                       │                                            │                    │                    │                    │
  │                       │──────────────── Verify JWT & Role ────────►│                    │                    │                    │
  │                       │◄────────────── Identity Established ───────│                    │                    │                    │
  │                       │                                                                 │                    │                    │
  │                       │───────────────────────── Execute Action ───────────────────────►│                    │                    │
  │                       │                                                                 │── Check Inv ──────►│                    │
  │                       │                                                                 │                    │── Check stock ────►│
  │                       │                                                                 │                    │◄── Available ──────│
  │                       │                                                                 │                    │                    │
  │                       │                                                                 │                    │── Start Trans. ───►│
  │                       │                                                                 │                    │   (Update Count &  │
  │                       │                                                                 │                    │    Create Record)  │
  │                       │                                                                 │                    │◄── Trans. Commit ──│
  │                       │                                                                 │◄── Return success ─│                    │
  │◄── 201 JSON Response ───────────────────────────────────────────────────────────────────│                    │                    │
```

---

## 13. API Response Standard

All HTTP JSON responses follow a predictable payload standard based on the **JSend** specification. This ensures client apps can parse success and error paths cleanly with a single, uniform contract.

### Success Envelope (HTTP 200 / 201)
```json
{
  "status": "success",
  "data": {
    "book": {
      "id": "e4b2d13a-ff19-4809-90b4-3677b10f5466",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "availableCopies": 4
    }
  }
}
```

### Fail Envelope (HTTP 4xx - Operational / Validation / Auth Failures)
```json
{
  "status": "fail",
  "message": "The requested book is currently out of stock.",
  "data": {
    "bookId": "e4b2d13a-ff19-4809-90b4-3677b10f5466"
  }
}
```

### Error Envelope (HTTP 5xx - Unexpected System Breakdowns)
```json
{
  "status": "error",
  "message": "An internal system error occurred. Please try again later."
}
```

---

## 14. HTTP Status Code Standard

To maintain clean and standardized communication with client applications, the backend uses precise HTTP status codes:

| Status Code | Label | Usage Scenario in LMS |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Successful resource retrieval, catalog queries, profile views, and successful returns. |
| **`201 Created`** | Created | Successful user signup, book record additions, or new borrow creation. |
| **`400 Bad Request`** | Client Error | Standard payload mismatch or attempting to return a book that is not marked as borrowed. |
| **`401 Unauthorized`** | Auth Required | Missing, malformed, or expired Bearer Token in request headers. |
| **`403 Forbidden`** | Privilege Error | Active member attempting to hit librarian-only routes (e.g., adding a new book). |
| **`404 Not Found`** | Missing | Requesting a book ID, user ID, or record ID that does not exist in the database. |
| **`422 Unprocessable Entity`** | Validation Failure | Express-validator block on invalid fields (e.g., invalid ISBN or negative total copies). |
| **`429 Too Many Requests`** | Rate Limited | IP limit exceeded on authentication, checkout, or browse endpoints. |
| **`500 Internal Error`**| Server Fault | Database connection loss or unhandled coding exceptions. |

---

## 15. Scalability Considerations

As the library platform grows, the system is designed to scale out easily with minimal code changes.

```
                                  Client Request
                                         │
                                         ▼
                                 [Load Balancer]
                                 (Round Robin)
                                  /     |     \
                                 /      |      \
                  ┌─────────────┘       │       └─────────────┐
                  ▼                     ▼                     ▼
          [Express App #1]      [Express App #2]      [Express App #3]
          (Stateless Worker)    (Stateless Worker)    (Stateless Worker)
                  \                     │                     /
                   \                    │                    /
                    ▼                   ▼                   ▼
                ┌──────────────────────────────────────────────┐
                │             PgBouncer / Pool                 │
                └──────────────────────┬───────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
          [MySQL Primary Node]                  [MySQL Read Replica]
               (Writes)                         (Catalog Read/Search)
```

### 1. Stateless Express Servers
* **Why**: The application stores absolutely no session state inside memory; all authorizations depend on signed JWT payloads.
* **How**: This allows you to launch multiple backend worker instances behind an external load balancer (e.g., AWS ALB, Nginx, or Cloud Run instance scaling). When traffic increases, more instances are provisioned instantly.

### 2. Database Connection Pooling
* **Why**: Database connection handshakes are resource-heavy and slow down high-concurrency systems.
* **How**: We configure Prisma to maintain a stable, reusable connection pool size (configured via `DATABASE_URL?connection_limit=20`). This ensures active worker threads share connections efficiently and prevents overloading the database port.

### 3. Read/Write Splitting (Command Query Responsibility Segregation)
* **Why**: Library catalogs are read-heavy (90% searching/catalog browsing, 10% borrowing/returning).
* **How**: The Prisma Client can be instantiated with two connection URLs: a **Write-Url** targeting the primary MySQL cluster node, and a **Read-Url** targeting a group of read replicas. Heavy search queries are directed to replicas, keeping the primary node unburdened for critical transactional borrow workflows.

---

## 16. Technical Interview Explanations

Here are clear, professional explanations for why these specific architectural choices are superior to simpler alternatives:

### Why Prisma ORM over raw SQL or Knex query builders?
* *The Common Trap*: Writing raw SQL strings is prone to typos, lacks autocomplete, and is highly vulnerable to SQL Injection if parameters are not meticulously managed.
* *The Architecture Win*: Prisma provides complete **compile-time type safety**. It auto-generates TypeScript interfaces directly from the schema layout. If a developer alters a database field name, TypeScript fails the build immediately before a single line of buggy code hits production. It also generates secure parameterized queries natively.

### Why Stateless JWT Session management over Express Session Cookies?
* *The Common Trap*: Stateful sessions require the backend to keep session maps in local memory, or maintain a centralized Redis cluster to look up session IDs. This complicates horizontal scaling, as a user's requests must stick to the same server node (Sticky Sessions).
* *The Architecture Win*: JWTs contain the user's details and role directly inside their cryptographically signed payload. Since the backend can verify the signature using only its private key, **any server instance can handle the request in total isolation**, simplifying horizontal scaling.

### Why a separate Service Layer over putting DB logic directly in Controllers?
* *The Common Trap*: Combining business rule validation and raw query actions inside a single controller action creates bloated, tightly coupled files. This makes writing unit tests extremely difficult because you cannot evaluate business logic without mocking complex HTTP request and response structures.
* *The Architecture Win*: The **Service Layer acts as the single source of truth** for business workflows. It remains completely unaware of HTTP requests, cookies, or headers. It can be tested easily in isolation using standard mock libraries.

### Why Database-level Transactions (`prisma.$transaction`) for checkout actions?
* *The Common Trap*: Decreasing a book's `availableCopies` in one query, then creating a `BorrowRecord` in another query without atomic transaction wrapping leaves a race-condition window. Under heavy traffic, two users could simultaneously query that 1 copy remains, both queries succeed, and the count drops below zero.
* *The Architecture Win*: Wrapping both operations inside an atomic transaction ensures an **"all-or-nothing" execution model (ACID compliance)**. If any step fails (such as inventory dropping below zero), MySQL rolls back the entire sequence, keeping the inventory accurate.
