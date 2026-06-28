# Enterprise Folder Structure & Modular Code Architecture Blueprint: Library Management System
**Prepared by: Lead Backend Architect**

This document details the production-ready folder structure, file-level organization, and dependency conventions for the Library Management System (LMS) Backend. Designed for clean separation of concerns, this architecture prevents codebase bloat, eliminates circular dependencies, and ensures high testability.

---

## 1. Production-Ready Folder Structure

Below is the complete physical folder layout. Every subdirectory is isolated by functional concern and contains specialized modules.

```
/
├── prisma/                          # Database configuration and migrator
│   ├── schema.prisma                # Database schema models and constraints definition
│   └── migrations/                  # Automated, version-controlled SQL migration scripts
│
├── src/
│   ├── config/                      # Immutable server configuration files
│   ├── constants/                   # Operational enums, static values, and HTTP codes
│   ├── controllers/                 # HTTP layer controllers (receives req, returns res)
│   ├── logs/                        # Application runtime execution log directory
│   ├── middlewares/                 # Pipeline filters (Security, Auth, Globals)
│   ├── routes/                      # Route registry mapping URIs to controllers
│   ├── services/                    # Domain logic & transactional database boundaries
│   ├── types/                       # Custom TypeScript declarations and namespace merges
│   ├── utils/                       # Stateless helper tools and utilities
│   ├── validators/                  # Structural request body & parameters check schemas
│   ├── app.ts                       # Express app bootstrap, middleware and route registration
│   └── server.ts                    # Entry-point establishing database connection & HTTP listener
│
├── .env.example                     # Environment variables schema documentation
├── package.json                     # NPM dependency registry
└── tsconfig.json                    # Compiler settings
```

---

## 2. Comprehensive Directory Specifications

---

### A. Directory: `src/config/`
* **Purpose**: Houses configuration modules that read environment variables, apply validation, and export read-only setup instances.
* **Responsibilities**:
  * Instantiate and export a single, global `PrismaClient` database connection pool.
  * Define security limits, environment configuration flags (`development` vs. `production`), and CORS rules.
* **Key Files**:
  * `db.ts`: Sets up the Prisma Client connection pooling pool size limits (`connection_limit=20`).
  * `security.ts`: Sets up values for password hashing difficulty, CORS origins, and token lifespans.
* **Dependencies**: Imports standard packages like `dotenv` and `@prisma/client`. No controller, route, or service files are ever imported here.

---

### B. Directory: `src/controllers/`
* **Purpose**: Coordinates request-response cycles. Acts as the interface between the client and the core business logic.
* **Responsibilities**:
  * Extract input parameters from routes (body, URL parameters, query parameters).
  * Validate structural validation checks before execution.
  * Delegate business rules and data orchestration to the Service Layer.
  * Serialize domain models into standard JSON envelopes using the JSend specification.
* **Key Files**:
  * `auth.controller.ts`: Handles requests for member registration and authentication.
  * `book.controller.ts`: Manages library book listings and updates.
  * `borrow.controller.ts`: Manages book checkouts and returns.
  * `member.controller.ts`: Manages library member profiles.
* **Dependencies**: Imports Express types, Service modules, and helper utilities. It does not access the database directly.

---

### C. Directory: `src/routes/`
* **Purpose**: Registers the application's URI endpoints and defines the middleware execution pipeline.
* **Responsibilities**:
  * Map HTTP methods and URL paths directly to controller actions.
  * Inject routing-specific security filters, authentication guards, and validation handlers.
* **Key Files**:
  * `index.ts`: Bundles and prefix-routes the API submodules.
  * `auth.routes.ts`: Maps paths for `/api/auth/register` and `/api/auth/login`.
  * `book.routes.ts`: Maps paths for CRUD operations, borrowing, and returning books.
  * `member.routes.ts`: Maps paths for member profile management.
* **Dependencies**: Imports Express Router, controllers, validation schemas, and middlewares.

---

### D. Directory: `src/services/`
* **Purpose**: Implements the core business logic and transactional database workflows.
* **Responsibilities**:
  * Enforce business rules and domain validations.
  * Manage transactional boundaries (`prisma.$transaction`) to keep data consistent.
  * Interact with the database using the Prisma Client.
* **Key Files**:
  * `auth.service.ts`: Verifies user credentials, hashes passwords, and signs JWTs.
  * `book.service.ts`: Manages inventory updates and stock counts.
  * `borrow.service.ts`: Handles transactional checkout logic and return checkouts.
  * `member.service.ts`: Manages profile lookups and member management.
* **Dependencies**: Imports Prisma Client, password hashing utilities, types, and custom application exceptions. Service layers are completely decoupled from Express and have no knowledge of HTTP requests, cookies, or responses.

---

### E. Directory: `src/middlewares/`
* **Purpose**: Intercepts and filters incoming HTTP requests before they reach controllers.
* **Responsibilities**:
  * Extract, parse, and verify JWT authentication headers.
  * Enforce role-based access controls (RBAC) across endpoints.
  * Centralize application exception logs and sanitize client error responses.
* **Key Files**:
  * `auth.middleware.ts`: Decodes and verifies JWT identity tokens.
  * `role.middleware.ts`: Evaluates authorization rules based on user roles.
  * `error.middleware.ts`: Captures exceptions, logs stack traces, and sanitizes production outputs.
  * `rateLimiter.middleware.ts`: Limits request rates on critical endpoints.
* **Dependencies**: Imports JWT helpers, Express types, and custom error classes.

---

### F. Directory: `src/validators/`
* **Purpose**: Defines request validation schemas to filter incoming payloads.
* **Responsibilities**:
  * Implement declarative schema validations for request parameters, query values, and request bodies.
  * Intercept bad requests before they hit controllers or database layers.
* **Key Files**:
  * `auth.validator.ts`: Sets rules for emails, names, and passwords.
  * `book.validator.ts`: Validates book titles, categories, authors, ISBNs, and stock quantities.
* **Dependencies**: Imports `express-validator` wrappers.

---

### G. Directory: `src/utils/`
* **Purpose**: Holds stateless utility functions and helper classes.
* **Responsibilities**:
  * Provide JWT signing, verification, and password encryption helpers.
  * Export structured logging interfaces and custom error constructors.
* **Key Files**:
  * `AppError.ts`: Custom exception constructor to distinguish operational and programmer errors.
  * `securityUtils.ts`: Encapsulates password hashing and verification methods.
  * `logger.ts`: Outputs structured application logs.
* **Dependencies**: Imports third-party packages like `bcryptjs`, `jsonwebtoken`, and standard system modules.

---

### H. Directory: `src/constants/`
* **Purpose**: Houses read-only static declarations and application-wide constants.
* **Responsibilities**:
  * Centralize HTTP status codes and domain-specific roles.
* **Key Files**:
  * `httpStatusCodes.ts`: Enforces standard HTTP status code names.
  * `errorMessages.ts`: Standardizes validation error responses.
* **Dependencies**: Contains only raw values; has zero internal dependencies.

---

### I. Directory: `src/types/`
* **Purpose**: Defines shared TypeScript interfaces and extends global namespaces.
* **Responsibilities**:
  * Keep your code type-safe with explicit domain types.
  * Extend standard Express Request interfaces to support custom parsed payloads (e.g., adding user properties to `req.user`).
* **Key Files**:
  * `express.d.ts`: Extends the default Express request namespace.
  * `domain.ts`: Declares structures for system models.
* **Dependencies**: Has zero internal dependencies.

---

### J. Directory: `src/logs/`
* **Purpose**: Stores application log files on disk (e.g., info logs, exception files, debug traces).
* **Responsibilities**:
  * Provide persistent logging on disk, configured with daily log rotation.
* **Dependencies**: Excluded from version control via `.gitignore`.

---

## 3. Thin Controllers vs. Thick Services Design Pattern

One of the most important design patterns in enterprise backends is the **Thin Controller / Thick Service** pattern.

```
[ Incoming HTTP Request ]
          │
          ▼
┌─────────────────────────────────┐
│           Controller            │  ◄── Lightweight (HTTP-specific concerns)
└────────┬────────────────────────┘
         │ Passes clean parameters (UUID strings, validated structures)
         ▼
┌─────────────────────────────────┐
│            Service              │  ◄── Heavyweight (Core business & transactional logic)
└─────────────────────────────────┘
```

### Why Business Logic Belongs in Services
1. **Separation of Concerns**: Controllers should only handle transport-level concerns—parsing route parameters, reading request headers, cookie management, and executing response serialization. They should not know how database tables are structured, how inventory calculations are made, or how business rules are validated.
2. **Reusability**: By keeping controllers lightweight, your business logic remains reusable. For example, if you decide to support queue-based task workers, CLI command runs, or WebSockets, you can invoke the same Service methods directly without having to mock Express request and response objects.
3. **Testability**: Services are purely HTTP-agnostic. They receive clean primitives and return typed objects, meaning they can be unit-tested directly using standard assertions and mock databases without spawning mock servers.

### Keeping Controllers Lightweight
In this architecture, a typical Controller method follows a predictable, highly-optimized sequence:
```typescript
// Conceptual Flow of a Lightweight Controller action
export const checkoutBook = catchAsync(async (req: Request, res: Response) => {
  // 1. Extract input variables
  const { id: bookId } = req.params;
  const memberId = req.user.id;

  // 2. Delegate to Service Layer
  const transactionReceipt = await BorrowService.borrowBook(memberId, bookId);

  // 3. Serialize output
  return res.status(201).json({
    status: "success",
    data: { transactionReceipt }
  });
});
```

---

## 4. Architectural Rules & Naming Standards

To maintain clean and readable code across a large development team, we enforce strict naming and import conventions:

### A. Naming and File Standards
* **Directories**: Always lowercase (e.g., `controllers`, `services`, `middlewares`).
* **File Suffixes**: Use explicit suffixes for clear file grouping (e.g., `auth.controller.ts`, `book.service.ts`, `auth.middleware.ts`, `book.validator.ts`). This makes locating files in your editor fast and efficient.
* **Variable Names**: standard camelCase (e.g., `borrowedBookList`, `availableQuantity`).
* **Classes and Types**: standard PascalCase (e.g., `AppError`, `BorrowRecord`).

### B. Import Organization Rules
To prevent import clutter and keep file headers readable, import statements must be structured in three distinct, ordered groups separated by a blank line:

```typescript
// Group 1: Node.js Built-In Core Modules
import path from "path";
import fs from "fs";

// Group 2: Third-Party External Libraries (NPM packages)
import express, { Request, Response } from "express";
import { body } from "express-validator";

// Group 3: Project-Specific Internal Modules (Relative paths or path-aliases)
import { db } from "@/config/db";
import { AppError } from "@/utils/AppError";
import { BorrowService } from "@/services/borrow.service";
```

---

## 5. Dependency Flow & Architecture Diagrams

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

## 6. Scaling as the Codebase Grows

This layered architecture is designed to scale gracefully as your codebase, team size, and request volumes grow:

### 1. Scaling Codebases via Domain-Driven Partitioning
When the number of modules grows from 3 to 30, a single flat `services/` or `controllers/` directory can become difficult to navigate. This architecture supports transitioning to a **Domain-Driven Modular Layout** (Bento Grid pattern) without breaking your architectural boundaries:

```
src/
├── modules/
│   ├── books/
│   │   ├── book.controller.ts
│   │   ├── book.service.ts
│   │   ├── book.routes.ts
│   │   └── book.validator.ts
│   │
│   ├── members/
│   │   ├── member.controller.ts
│   │   ├── member.service.ts
│   │   ├── member.routes.ts
│   │   └── member.validator.ts
```
Moving modules into feature folders takes only a few minutes and keeps related files close together, simplifying ownership in multi-team organizations.

### 2. Transitioning to Microservices
Because our Service Layer is completely decoupled from the HTTP transport layer (Express), extracting a domain module into a standalone microservice (e.g., migrating book recommendations or search features into a separate Node.js service) requires minimal effort. You can copy the domain Service and database models to a new microservice repository, with no Express routes or controller rewrites required.
