# Relational Database Architecture: Library Management System

This document details the production-grade **MySQL relational database schema and physical design** for the Library Management System. Designed from the perspective of a Senior Database Architect, it addresses structural integrity, relational modeling, constraints, transactional safety, and high-performance indexing strategies.

---

## 1. Entity-Relationship Diagram (ERD)

The system is modeled around three core business entities: **Users** (representing members and librarians), **Books** (representing the catalog), and **Borrow Records** (representing the transactional state of book checkouts).

```
  ┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
  │              USERS              │                 │              BOOKS              │
  ├─────────────────────────────────┤                 ├─────────────────────────────────┤
  │ PK  id           VARCHAR(36)    │                 │ PK  id           VARCHAR(36)    │
  │ UK  email        VARCHAR(255)   │                 │ UK  isbn         VARCHAR(20)    │
  │     passwordHash VARCHAR(255)   │                 │     title        VARCHAR(255)   │
  │     name         VARCHAR(100)   │                 │     author       VARCHAR(100)   │
  │     role         ENUM           │                 │     category     VARCHAR(100)   │
  │     createdAt    TIMESTAMP      │                 │     quantity     INT            │
  │     updatedAt    TIMESTAMP      │                 │     avail_qty    INT            │
  └──────────────┬──────────────────┘                 └──────────────┬──────────────────┘
                 │ 1                                                 │ 1
                 │                                                   │
                 │ 1..N (onDelete: RESTRICT)                         │ 1..N (onDelete: RESTRICT)
                 ▼                                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                   BORROW_RECORDS                                    │
  ├─────────────────────────────────────────────────────────────────────────────────────┤
  │ PK  id           VARCHAR(36)                                                        │
  │ FK  memberId     VARCHAR(36)  ────────► (References USERS.id)                       │
  │ FK  bookId       VARCHAR(36)  ────────► (References BOOKS.id)                       │
  │     borrowDate   TIMESTAMP                                                          │
  │     dueDate      TIMESTAMP                                                          │
  │     returnDate   TIMESTAMP [NULL]                                                   │
  │     status       ENUM('BORROWED', 'RETURNED', 'OVERDUE')                            │
  │     createdAt    TIMESTAMP                                                          │
  │     updatedAt    TIMESTAMP                                                          │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Structures & Physical Design Specifications

### A. Table: `users`
This table holds the identity, authentication credentials, and access control levels of both library members and administrative librarians.

* **Primary Key**: `id` — `VARCHAR(36)` containing a globally unique UUIDv4. This shields sequential business metrics from external exposure and guarantees ease of scaling during horizontal database sharding.
* **Unique Constraints**: `email` — `VARCHAR(255)` with unique constraint. Emails must be stored in lowercase to prevent duplicate logins with varying cases (e.g., `user@domain.com` vs `User@Domain.com`).
* **Indexes**: 
  * `idx_users_role`: Single-column B-Tree index on `role` to support fast grouping and administrative audits.

| Field Name | Physical Data Type | Nullability | Key | Default Value | Business & Integrity Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`id`** | `VARCHAR(36)` | `NOT NULL` | **PK** | *None* | Generates a standard UUIDv4 on creation. |
| **`email`** | `VARCHAR(255)` | `NOT NULL` | **UK** | *None* | Normalised to lowercase. Used as the main authentication handle. |
| **`passwordHash`** | `VARCHAR(255)` | `NOT NULL` | *None* | *None* | Secure `bcrypt` cryptographic hash (never stores plaintext). |
| **`name`** | `VARCHAR(100)` | `NOT NULL` | *None* | *None* | Captures the member/librarian's full profile name. |
| **`role`** | `ENUM('MEMBER', 'LIBRARIAN')` | `NOT NULL` | *None* | `'MEMBER'` | Controls authorization routes. Librarians are manually updated/seeded. |
| **`createdAt`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6)`| Auto-assigned tracking time. |
| **`updatedAt`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` | Keeps dynamic record of changes. |

---

### B. Table: `books`
This table represents the cataloged literature resources and manages inventory metrics to handle checkout transactions.

* **Primary Key**: `id` — `VARCHAR(36)` containing a globally unique UUIDv4.
* **Unique Constraints**: `isbn` — `VARCHAR(20)`. The International Standard Book Number uniquely identifies physical editions. Enforcing this constraint blocks duplicate catalog insertion.
* **Indexes**:
  * `idx_books_isbn`: Single B-tree unique index.
  * `idx_books_lookup`: Composite index on `(category, author)` to drastically speed up catalog filtering.
* **Database Check Constraints (MySQL 8.0+)**:
  * `chk_books_quantity`: `quantity >= 0` — Establishes that the physical inventory can never be negative.
  * `chk_books_avail_qty`: `availableQuantity >= 0 AND availableQuantity <= quantity` — Guarantees on-shelf inventory never drops below zero and never exceeds total holdings.

| Field Name | Physical Data Type | Nullability | Key | Default Value | Business & Integrity Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`id`** | `VARCHAR(36)` | `NOT NULL` | **PK** | *None* | Universally unique book identifier. |
| **`title`** | `VARCHAR(255)` | `NOT NULL` | *None* | *None* | Name of the volume. |
| **`author`** | `VARCHAR(100)` | `NOT NULL` | *None* | *None* | Primary author or contributor. |
| **`isbn`** | `VARCHAR(20)` | `NOT NULL` | **UK** | *None* | Enforces standard unique ISBN formatting. |
| **`category`** | `VARCHAR(100)` | `NOT NULL` | *None* | *None* | Classification (e.g., Fiction, Science, Technology). |
| **`quantity`** | `INT` | `NOT NULL` | *None* | `1` | Total copy count owned by the library. Must be $\ge 0$. |
| **`availableQuantity`**| `INT` | `NOT NULL` | *None* | `1` | Count currently on shelves. Must be $\le$ `quantity` and $\ge 0$. |
| **`createdAt`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6)`| Audit log of record generation. |
| **`updatedAt`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` | Tracks details updates. |

---

### C. Table: `borrow_records`
This represents the transactional connection table, maintaining the borrow history and live status of active rentals.

* **Primary Key**: `id` — `VARCHAR(36)` UUIDv4.
* **Foreign Keys**:
  * `memberId` REFERENCES `users(id)`
  * `bookId` REFERENCES `books(id)`
* **Cascading & Referral Rules**: Enforces **`ON DELETE RESTRICT / ON UPDATE CASCADE`**. This represents a critical data durability standard:
  * A user's account cannot be hard deleted if there are historic or active borrowing lines pointing to their key.
  * A book cannot be deleted if a user is currently borrowing it, or if auditing histories require its ledger.
* **Indexes**:
  * `idx_borrow_member_status`: Composite index on `(memberId, status)` to speed up personal dashboards tracking current checkouts.
  * `idx_borrow_book_status`: Composite index on `(bookId, status)` to speed up auditing tasks.

| Field Name | Physical Data Type | Nullability | Key | Default Value | Business & Integrity Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`id`** | `VARCHAR(36)` | `NOT NULL` | **PK** | *None* | Transaction line item UUID. |
| **`memberId`** | `VARCHAR(36)` | `NOT NULL` | **FK** | *None* | Connects to `users(id)`. Identifies the active borrower. |
| **`bookId`** | `VARCHAR(36)` | `NOT NULL` | **FK** | *None* | Connects to `books(id)`. Identifies the checked out volume. |
| **`borrowDate`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6)` | The literal date-time of checkout. |
| **`dueDate`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | *None* | Timestamp by which the book must be returned. |
| **`returnDate`** | `TIMESTAMP(6)` | `NULL` | *None* | `NULL` | Set when returned. Remains `NULL` while checked out. |
| **`status`** | `ENUM('BORROWED', 'RETURNED', 'OVERDUE')` | `NOT NULL` | *None* | `'BORROWED'` | Tracks checkout lifecycle status. |
| **`createdAt`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6)`| Systems log timestamp. |
| **`updatedAt`** | `TIMESTAMP(6)` | `NOT NULL` | *None* | `CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` | Updates when status changes. |

---

## 3. Core Database Concepts & Architectural Decisions

### Why a separate `borrow_records` table instead of storing book arrays inside `users`?

Storing a list of borrowed book IDs directly in the `users` table (e.g., as a JSON array or a comma-separated string) is an anti-pattern that violates core relational database tenets. Here is why the junction table architecture is superior:

#### 1. Avoids Data Redundancy and Multi-Value Fields (First Normal Form Violation)
In a relational database, values in a column must be atomic (First Normal Form). Storing arrays of book IDs makes basic queries extremely complex and slow. For example, updating the status of a single borrowed book would require parsing, editing, and saving a text string, which is highly prone to concurrency bugs and data loss.

#### 2. Enables Transactional Metadata Storage
A borrow record contains critical transaction-specific metadata: the exact checkout date, due date, return date, and status (Borrowed, Returned, Overdue). Storing these values inside the `users` table would require maintaining complex multi-dimensional arrays, which is highly inefficient and fragile.

#### 3. Enforces Referential Integrity
By using a separate junction table with Foreign Keys, we enforce strict database-level referential integrity. MySQL ensures that a user cannot borrow a non-existent book ID, and that a book cannot be deleted while a user is actively borrowing it. An array of strings inside a user record cannot enforce these constraints natively.

---

## 4. Normalization Strategy & De-normalization Decisions

Database normalization structures schemas to eliminate data redundancy and prevent data anomalies (insertion, update, and deletion anomalies).

### 1. First Normal Form (1NF)
* *Requirement*: All tables must contain only atomic values, and each record must have a unique identifier.
* *Implementation*: We use UUID string primary keys for all tables. Each column (e.g., `isbn`, `email`, `borrowDate`) contains exactly one value—no arrays or comma-separated lists are used.

### 2. Second Normal Form (2NF)
* *Requirement*: The table must meet 1NF, and all non-key columns must fully depend on the entire primary key, not a subset of it (no partial dependencies).
* *Implementation*: In `borrow_records`, all transaction properties (e.g., `borrowDate`, `dueDate`, `returnDate`) depend entirely on the compound key relationship. They do not describe users or books in isolation, but specifically the transaction connecting them.

### 3. Third Normal Form (3NF)
* *Requirement*: The table must meet 2NF, and no non-key columns can depend on other non-key columns (no transitive dependencies).
* *Implementation*: Book details like `title`, `author`, and `category` depend exclusively on the book's `id`. They are not stored inside `borrow_records`, preventing redundancy. If a book's title is corrected, the change is made in a single row within the `books` table, and all historic borrow records reflect the update automatically.

---

## 5. Performance Indexing Strategy for High Concurrency

To ensure the database can scale to handle high volumes of concurrent requests (e.g., during exam seasons when checkout rates spike), we implement targeted indexes:

```sql
-- 1. Accelerates catalog search and categorical filtering
CREATE INDEX idx_books_lookup ON books (category, author);

-- 2. Optimizes personal member dashboards and borrowing history lookups
CREATE INDEX idx_borrow_member_status ON borrow_records (memberId, status);

-- 3. Enables fast auditing of checked-out books for inventory management
CREATE INDEX idx_borrow_book_status ON borrow_records (bookId, status);

-- 4. Speeds up administrative queries filtering users by role
CREATE INDEX idx_users_role ON users (role);
```

### Why these indexes matter:
* **Reading/Browsing Catalog**: Users frequently search for books within a specific category or by a particular author. The composite index `idx_books_lookup` organizes these records sequentially in the B-Tree index, reducing search time from $O(N)$ (table scan) to $O(\log N)$.
* **Active Borrow Queries**: When a user loads their dashboard, the system needs to find all books they are currently borrowing. The composite index `idx_borrow_member_status` allows the database engine to locate only the records matching the specific user and status (`BORROWED`) in microseconds.
