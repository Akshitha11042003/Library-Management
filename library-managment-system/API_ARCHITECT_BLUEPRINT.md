# REST API Architecture & Endpoint Specification: Library Management System
**Prepared by: Senior Backend API Architect**

This document defines the complete REST API specification and transport layer architecture for the Library Management System (LMS). It details our architectural standards, endpoints, validation rules, transactional processes, and query paradigms to ensure a robust, high-performance, and secure interface.

---

## 1. Unified API Response Envelope (JSend Specification)

To provide a consistent and predictable integration experience for client-side applications (React, Mobile, etc.), all endpoints must return standard JSON payloads. We adopt a modified **JSend specification** containing exactly three states: `success`, `fail`, and `error`.

### A. Success Envelope (HTTP 200 / 201)
Used when an action completes successfully. The response always returns a `status` of `"success"` and a nested `data` envelope containing the payload.

```json
{
  "status": "success",
  "data": {
    "book": {
      "id": "7ca6b8be-b337-4bf7-9a4d-011116c276f6",
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "isbn": "978-0134494166",
      "category": "Software Engineering",
      "quantity": 10,
      "availableQuantity": 10
    }
  }
}
```

### B. Fail Envelope (HTTP 400 / 401 / 403 / 404 / 422 / 429)
Used for client-side errors, validation failures, or business rule violations (operational errors). The response returns a `status` of `"fail"`, a human-readable `message`, and an optional structured `errors` object for form field validation.

```json
{
  "status": "fail",
  "message": "Validation failed on input parameters.",
  "errors": [
    {
      "field": "email",
      "message": "Must provide a valid email address formatting"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

### C. Error Envelope (HTTP 500)
Used when an unexpected server error occurs (e.g., database connection failure, syntax error). The response returns a `status` of `"error"` and a sanitized, generic error message. Technical details and stack traces are logged securely on the server and are never exposed to clients in production.

```json
{
  "status": "error",
  "message": "An internal server error occurred. Please try again later."
}
```

---

## 2. HTTP Methods & Resource Design Philosophy

Our route design adheres to standard RESTful principles, where resource collections are represented by plural nouns (e.g., `/api/books`, `/api/users`), and operations are defined by specific HTTP methods:

* **`POST`**: Used to create new resources (e.g., adding a book, checking out/borrowing a book, registering a member). It is non-idempotent; multiple identical calls will result in multiple resource creations.
* **`GET`**: Used to retrieve resources. It is strictly safe and idempotent, meaning it never mutates server state.
* **`PUT`**: Used to update an entire existing resource by replacing its representation. It is idempotent; repeating the identical update call multiple times results in the same final state.
* **`DELETE`**: Used to purge resources. It is idempotent; deleting an already deleted resource still results in the resource being gone.

---

## 3. Comprehensive REST API Endpoint Registry

---

### A. Authentication Resource group

#### 1. Register Member
* **Route**: `/api/auth/register`
* **HTTP Method**: `POST`
* **Authentication**: Not Required
* **Authorization**: Not Required
* **Request Body (JSON)**:
  ```json
  {
    "email": "member@library.org",
    "password": "Password123!",
    "name": "Jane Doe"
  }
  ```
* **Validation Rules**:
  * `email`: Required, must be a valid email format, must normalize to lowercase.
  * `password`: Required, minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number.
  * `name`: Required, string, length between 2 and 100 characters, alphanumeric with standard spacing.
* **Business Logic**:
  1. Check if the email address is already registered in the system. If so, return an error.
  2. Hash the plaintext password using `bcrypt` (12 salt rounds).
  3. Create a new user record in the database with the default role of `'MEMBER'`.
* **Success Response** (`HTTP 201 Created`):
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "e30c25a7-96a9-4674-8b9a-cb6df6631bf3",
        "email": "member@library.org",
        "name": "Jane Doe",
        "role": "MEMBER",
        "createdAt": "2026-06-28T03:54:12Z"
      }
    }
  }
  ```
* **Error Responses**:
  * `HTTP 422 Unprocessable Entity`: Field validation failed (e.g., invalid email, weak password).
  * `HTTP 400 Bad Request`: Email already registered.

#### 2. User Login
* **Route**: `/api/auth/login`
* **HTTP Method**: `POST`
* **Authentication**: Not Required
* **Authorization**: Not Required
* **Request Body (JSON)**:
  ```json
  {
    "email": "member@library.org",
    "password": "Password123!"
  }
  ```
* **Validation Rules**:
  * `email`: Required, valid email format, normalized to lowercase.
  * `password`: Required, string.
* **Business Logic**:
  1. Locate the user in the database by email. If the user does not exist, return a generic auth failure error.
  2. Compare the provided plaintext password with the stored hash using `bcrypt.compare`. If they do not match, return a generic auth failure error.
  3. Sign a JWT access token using the server's private `JWT_SECRET` key (payload contains `userId` and `role`, expires in 15 minutes).
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...",
      "user": {
        "id": "e30c25a7-96a9-4674-8b9a-cb6df6631bf3",
        "email": "member@library.org",
        "name": "Jane Doe",
        "role": "MEMBER"
      }
    }
  }
  ```
* **Error Responses**:
  * `HTTP 401 Unauthorized`: Invalid credentials (the error message is kept generic to prevent username enumeration attacks).

---

### B. Books Resource Group

#### 3. Add Book (Librarian CRUD)
* **Route**: `/api/books`
* **HTTP Method**: `POST`
* **Authentication**: Required (`Bearer Token`)
* **Authorization**: Required (`LIBRARIAN` only)
* **Request Body (JSON)**:
  ```json
  {
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "978-0132350884",
    "category": "Computer Science",
    "quantity": 5
  }
  ```
* **Validation Rules**:
  * `title`: Required, string, 1 to 255 characters.
  * `author`: Required, string, 1 to 100 characters.
  * `isbn`: Required, string format conforming to ISBN-10 or ISBN-13 patterns.
  * `category`: Required, string, 1 to 100 characters.
  * `quantity`: Required, integer, must be greater than or equal to 1.
* **Business Logic**:
  1. Check if a book with the given ISBN already exists. If so, return an error.
  2. Create a new book record, initializing both `quantity` and `availableQuantity` to the provided quantity value.
* **Success Response** (`HTTP 201 Created`):
  ```json
  {
    "status": "success",
    "data": {
      "book": {
        "id": "9a0fd8b3-764f-4dcb-9fe3-4eb00be2c75a",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "isbn": "978-0132350884",
        "category": "Computer Science",
        "quantity": 5,
        "availableQuantity": 5
      }
    }
  }
  ```
* **Error Responses**:
  * `HTTP 401 Unauthorized`: Token missing or expired.
  * `HTTP 403 Forbidden`: Authenticated user is a MEMBER, not a LIBRARIAN.
  * `HTTP 400 Bad Request`: Book with this ISBN already exists.

#### 4. Get All Books (Catalog View)
* **Route**: `/api/books`
* **HTTP Method**: `GET`
* **Authentication**: Required (`Bearer Token`)
* **Authorization**: Required (`MEMBER` or `LIBRARIAN`)
* **Query Parameters**:
  * `page`: Integer (default: 1)
  * `limit`: Integer (default: 10, max: 100)
  * `search`: String (searches title/author, default: empty)
  * `category`: String (filters by category, default: empty)
  * `sortBy`: String (field to sort by, default: `title`)
  * `sortOrder`: String (`asc` or `desc`, default: `asc`)
* **Business Logic**:
  1. Apply search and category filters to the DB query.
  2. Calculate the pagination offset: `(page - 1) * limit`.
  3. Query the database to retrieve the filtered list of books, along with the total count to calculate total pages.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "books": [
        {
          "id": "9a0fd8b3-764f-4dcb-9fe3-4eb00be2c75a",
          "title": "Clean Code",
          "author": "Robert C. Martin",
          "isbn": "978-0132350884",
          "category": "Computer Science",
          "quantity": 5,
          "availableQuantity": 3
        }
      ],
      "pagination": {
        "totalRecords": 125,
        "currentPage": 1,
        "totalPages": 13,
        "limit": 10
      }
    }
  }
  ```

#### 5. Get Book By ID
* **Route**: `/api/books/:id`
* **HTTP Method**: `GET`
* **Authentication**: Required
* **Authorization**: Required (`MEMBER` or `LIBRARIAN`)
* **Path Parameters**:
  * `id`: UUID string of the target book.
* **Business Logic**:
  1. Fetch the book by its unique ID. If it does not exist, return a `404 Not Found` error.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "book": {
        "id": "9a0fd8b3-764f-4dcb-9fe3-4eb00be2c75a",
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "isbn": "978-0132350884",
        "category": "Computer Science",
        "quantity": 5,
        "availableQuantity": 3
      }
    }
  }
  ```
* **Error Responses**:
  * `HTTP 404 Not Found`: Book ID does not exist in the catalog.

#### 6. Update Book
* **Route**: `/api/books/:id`
* **HTTP Method**: `PUT`
* **Authentication**: Required
* **Authorization**: Required (`LIBRARIAN` only)
* **Path Parameters**:
  * `id`: UUID string of the target book.
* **Request Body (JSON)**:
  ```json
  {
    "title": "Clean Code - Updated",
    "author": "Robert C. Martin",
    "category": "Programming Languages",
    "quantity": 7
  }
  ```
* **Validation Rules**:
  * `quantity`: Required, integer, must be greater than or equal to the number of copies currently checked out.
* **Business Logic**:
  1. Fetch the book by ID.
  2. Calculate the difference between the new total quantity and the old total quantity.
  3. Ensure the new quantity doesn't drop below the number of copies currently checked out: `quantity - (old_quantity - old_availableQuantity) >= 0`.
  4. Update the book's details and recalculate `availableQuantity`.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "book": {
        "id": "9a0fd8b3-764f-4dcb-9fe3-4eb00be2c75a",
        "title": "Clean Code - Updated",
        "author": "Robert C. Martin",
        "isbn": "978-0132350884",
        "category": "Programming Languages",
        "quantity": 7,
        "availableQuantity": 5
      }
    }
  }
  ```
* **Error Responses**:
  * `HTTP 404 Not Found`: Book ID does not exist.
  * `HTTP 400 Bad Request`: New total quantity is invalid because too many copies are currently checked out.

#### 7. Delete Book
* **Route**: `/api/books/:id`
* **HTTP Method**: `DELETE`
* **Authentication**: Required
* **Authorization**: Required (`LIBRARIAN` only)
* **Path Parameters**:
  * `id`: UUID string of the target book.
* **Business Logic**:
  1. Check if the book exists. If not, throw a `404 Not Found` error.
  2. Check if there are any active borrow records for this book (`status = 'BORROWED'`). If so, block deletion and return a `400 Bad Request` to preserve catalog integrity.
  3. If all copies are safely on shelves (`availableQuantity = quantity`), delete the book.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "message": "Book successfully deleted from catalog."
  }
  ```
* **Error Responses**:
  * `HTTP 400 Bad Request`: Cannot delete book because copies are currently checked out by members.

#### 8. Borrow Book
* **Route**: `/api/books/:id/borrow`
* **HTTP Method**: `POST`
* **Authentication**: Required
* **Authorization**: Required (`MEMBER` only)
* **Path Parameters**:
  * `id`: UUID string of the book to borrow.
* **Business Logic**:
  1. Must execute within an atomic database transaction (`prisma.$transaction`) with pessimistic locking (`FOR UPDATE`) on the book row.
  2. Check if the book exists. If not, abort and return a `404 Not Found` error.
  3. Check if the book is available for checkout (`availableQuantity > 0`). If not, abort and return a `400 Bad Request`.
  4. Check if the member already has an active borrow record for this book (`status = 'BORROWED'`). If so, block the borrow to prevent duplicate active rentals of the same book.
  5. Check if the member has reached the active borrowing limit (e.g., maximum of 5 books checked out). If exceeded, block checkout.
  6. Decrease `availableQuantity` by 1.
  7. Create a new `BorrowRecord` with status `'BORROWED'`, setting `borrowDate` to the current time and `dueDate` to 14 days in the future.
* **Success Response** (`HTTP 201 Created`):
  ```json
  {
    "status": "success",
    "data": {
      "borrowRecord": {
        "id": "e9698d28-8fa3-43ef-ad9c-72064112e52b",
        "memberId": "e30c25a7-96a9-4674-8b9a-cb6df6631bf3",
        "bookId": "9a0fd8b3-764f-4dcb-9fe3-4eb00be2c75a",
        "borrowDate": "2026-06-28T03:55:00Z",
        "dueDate": "2026-07-12T03:55:00Z",
        "status": "BORROWED"
      }
    }
  }
  ```
* **Error Responses**:
  * `HTTP 400 Bad Request`: Book is out of stock, user has already borrowed this book, or user has reached their maximum borrowing limit.

#### 9. Return Book
* **Route**: `/api/books/:id/return`
* **HTTP Method**: `POST`
* **Authentication**: Required
* **Authorization**: Required (`MEMBER` only)
* **Path Parameters**:
  * `id`: UUID string of the book to return.
* **Business Logic**:
  1. Must execute within an atomic database transaction.
  2. Locate the active borrow record for this member and book (`memberId` from token, `bookId` from route param, `status = 'BORROWED'`). If none exists, return a `400 Bad Request` error.
  3. Increase the book's `availableQuantity` by 1.
  4. Update the `BorrowRecord`: set `status` to `'RETURNED'`, and set `returnDate` to the current server timestamp.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "borrowRecord": {
        "id": "e9698d28-8fa3-43ef-ad9c-72064112e52b",
        "status": "RETURNED",
        "returnDate": "2026-06-28T04:12:00Z"
      }
    }
  }
  ```

---

### C. Members Resource Group

#### 10. Get All Members (Librarian View)
* **Route**: `/api/members`
* **HTTP Method**: `GET`
* **Authentication**: Required
* **Authorization**: Required (`LIBRARIAN` only)
* **Business Logic**:
  1. Retrieve all user profiles where `role = 'MEMBER'`.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "members": [
        {
          "id": "e30c25a7-96a9-4674-8b9a-cb6df6631bf3",
          "email": "member@library.org",
          "name": "Jane Doe",
          "createdAt": "2026-06-28T03:54:12Z"
        }
      ]
    }
  }
  ```

#### 11. Delete Member (Librarian Action)
* **Route**: `/api/members/:id`
* **HTTP Method**: `DELETE`
* **Authentication**: Required
* **Authorization**: Required (`LIBRARIAN` only)
* **Path Parameters**:
  * `id`: UUID string of the member to delete.
* **Business Logic**:
  1. Verify the user exists and has the role of `'MEMBER'`.
  2. Check if the member has any active borrow records (`status = 'BORROWED'`). If so, block deletion and return a `400 Bad Request` to prevent orphaned books and unpaid liabilities.
  3. If no active borrows exist, delete the user.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "message": "Member profile deleted successfully."
  }
  ```

#### 12. My Borrowed Books (Member Profile View)
* **Route**: `/api/members/me/borrows`
* **HTTP Method**: `GET`
* **Authentication**: Required
* **Authorization**: Required (`MEMBER` only)
* **Business Logic**:
  1. Retrieve the authenticated user's ID from the decoded JWT payload.
  2. Query all `BorrowRecord` entries matching `memberId` and `status = 'BORROWED'`, including book details (title, author, isbn) via relation joins.
* **Success Response** (`HTTP 200 OK`):
  ```json
  {
    "status": "success",
    "data": {
      "borrowedBooks": [
        {
          "borrowId": "e9698d28-8fa3-43ef-ad9c-72064112e52b",
          "borrowDate": "2026-06-28T03:55:00Z",
          "dueDate": "2026-07-12T03:55:00Z",
          "book": {
            "id": "9a0fd8b3-764f-4dcb-9fe3-4eb00be2c75a",
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "isbn": "978-0132350884"
          }
        }
      ]
    }
  }
  ```

---

## 4. Execution Flow Deep Dive: Borrow & Return Transactions

Let's break down the step-by-step transaction logic for borrowing and returning books to understand how we maintain database consistency.

### A. Borrow Transaction Flow (Atomic & Isolated)
When a member requests to borrow a book via `POST /api/books/:id/borrow`:

1. **Authentication**: Auth middleware validates the JWT from the request header and populates `req.user` with the member's ID and role.
2. **Authorization**: RBAC middleware checks `req.user.role` to ensure the user is a `MEMBER`.
3. **Transaction Isolation**: The service layer initiates a database transaction block (`prisma.$transaction`).
4. **Pessimistic Locking**: The system queries the book table by ID using a pessimistic lock (`FOR UPDATE`), blocking other concurrent transactions from modifying this specific book row until this transaction completes.
5. **Inventory Check**:
   * If `availableQuantity <= 0`, the transaction is rolled back, and an error is returned.
6. **Business Rules Evaluation**:
   * Check if the member has already borrowed this book and hasn't returned it yet (`status == 'BORROWED'`). If so, abort and roll back.
   * Check if the member's total active borrowing count exceeds the library limit (e.g., 5 books). If so, abort and roll back.
7. **Inventory Mutation**:
   * Decrease the book's `availableQuantity` by 1.
8. **Ledger Creation**:
   * Insert a new row into the `BorrowRecords` table, setting `memberId`, `bookId`, `borrowDate` (current time), `dueDate` (current time + 14 days), and `status` to `'BORROWED'`.
9. **Commit**: The transaction commits, saving all changes to the database and releasing the pessimistic lock.
10. **Response**: The controller returns a `201 Created` status with the new borrow record payload.

---

### B. Return Transaction Flow (Atomic & Isolated)
When a member returns a book via `POST /api/books/:id/return`:

1. **Identity Resolution**: Auth middleware validates the JWT and extracts the member's ID.
2. **Transaction Isolation**: Initiate a transaction block (`prisma.$transaction`).
3. **Active Borrow Resolution**: Query the `BorrowRecords` table for an active transaction:
   * Condition: `memberId == authenticated_user_id AND bookId == target_book_id AND status == 'BORROWED'`.
   * Lock the target row using `FOR UPDATE` to prevent concurrent return processing.
   * If no active record is found, abort the transaction and return a `400 Bad Request` ("This book is not currently marked as borrowed by you").
4. **Inventory Restoration**:
   * Lock the book row via `FOR UPDATE`.
   * Increase the book's `availableQuantity` by 1.
5. **Ledger Closure**:
   * Update the locked `BorrowRecord`: set `status` to `'RETURNED'`, and set `returnDate` to the current server timestamp.
6. **Commit**: The transaction commits, updating the database and releasing all row locks.
7. **Response**: Return a `200 OK` status with the updated borrow record.

---

## 5. Catalog Query Enhancements: Pagination, Filtering, & Sorting

To keep catalog browsing fast and responsive as the library scales, the `GET /api/books` endpoint supports several query features:

### A. Pagination (Offset-Based)
To prevent loading millions of books into application memory, we implement offset-based pagination:
* **`page`**: The current page number (e.g., `page=2`).
* **`limit`**: The number of records to return per page (e.g., `limit=10`).
* **Offset Calculation**: The SQL query uses `LIMIT {limit} OFFSET {(page - 1) * limit}` under the hood.

### B. Search & Filtering
* **Global Search (`search`)**: Cleans and filters the input, searching for partial matches across both title and author fields:
  ```sql
  WHERE title LIKE '%search%' OR author LIKE '%search%'
  ```
* **Categorical Filtering (`category`)**: Filters results to return only books matching a specific category (e.g., `category=Science`).

### C. Dynamic Sorting
* **`sortBy`**: Specifies the database column to sort by (e.g., `title`, `author`, `createdAt`). To prevent SQL Injection, this field is validated against a white-list of allowed columns: `['title', 'author', 'category', 'createdAt']`.
* **`sortOrder`**: Controls the sort direction. Validated to allow only `'asc'` or `'desc'`.
