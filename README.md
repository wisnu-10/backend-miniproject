# Mini Project V2 - Backend

This is the backend service for the Mini Project V2 application, built with Node.js, Express, TypeScript, and Prisma. It handles user authentication, event management, and transactions.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & Cookies (HttpOnly)
- **File Upload**: Multer + Cloudinary
- **Email**: Nodemailer
- **Validation**: express-validator

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL installed and running
- npm or yarn

### Installation

1.  **Clone the repository** (if you haven't already):

    ```bash
    git clone <repository-url>
    cd mini-project-v2/backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root `backend` directory based on the example below:

    ```env
    # Server Configuration
    PORT=8000
    NODE_ENV=development

    # Database Configuration
    DATABASE_URL="postgresql://user:password@localhost:5432/mini_project_db?schema=public"

    # Security
    JWT_SECRET="your_super_secret_key_change_this"

    # Cloudinary (for profile picture upload)
    CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"

    # Email (for password reset)
    SMTP_HOST="smtp.gmail.com"
    SMTP_PORT=587
    SMTP_USER="your_email@gmail.com"
    SMTP_PASS="your_app_password"
    FRONTEND_URL="http://localhost:3000"
    ```

4.  **Database Migration**:
    Push the Prisma schema to your PostgreSQL database:

    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Start the Server**:
    - **Development** (with hot-reload):
      ```bash
      npm run dev
      ```
    - **Production Build**:
      ```bash
      npm run build
      npm start
      ```

## 📂 Project Structure

```
backend/
├── prisma/               # Prisma schema and migrations
├── src/
│   ├── config/           # Configuration files (Prisma client)
│   ├── controllers/      # Request handlers
│   ├── generated/        # Generated types (Prisma)
│   ├── middleware/       # Express middleware (Auth, etc.)
│   ├── routes/           # API Route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Helper functions (Referral code gen)
│   ├── validators/       # express-validator middleware
│   └── server.ts         # Entry point
└── ...
```

## 📖 API Documentation

### Authentication (`/api/auth`)

#### 1. Register User

Create a new account. Generates a unique referral code automatically.

- **Endpoint**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "full_name": "John Doe",
    "role": "CUSTOMER", // or "ORGANIZER"
    "phone_number": "08123456789",
    "referral_code": "OPTIONAL_REF_CODE"
  }
  ```
- **Validation**:

  | Field           | Rule                                            |
  | --------------- | ----------------------------------------------- |
  | `email`         | Required, valid email format                    |
  | `password`      | Required, min 6 characters, max 50 characters   |
  | `full_name`     | Required, min 3 characters, max 100 characters  |
  | `role`          | Required, must be 'CUSTOMER' or 'ORGANIZER'     |
  | `phone_number`  | Optional, valid Indonesian mobile number format |
  | `referral_code` | Optional                                        |

- **Response (201)**:
  ```json
  {
    "message": "User registered successfully",
    "user": { ... }
  }
  ```

#### 2. Login

Authenticate and receive a session cookie.

- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Validation**:

  | Field      | Rule                         |
  | ---------- | ---------------------------- |
  | `email`    | Required, valid email format |
  | `password` | Required                     |

- **Response (200)**:
  - Sets an `HttpOnly` cookie named `token`.
  ```json
  {
    "message": "Login successful",
    "user": { ... },
    "token": "..."
  }
  ```

#### 3. Logout

Destroy the session.

- **Endpoint**: `POST /api/auth/logout`
- **Response (200)**:
  ```json
  {
    "message": "Logout successful"
  }
  ```

#### 4. Forgot Password

Request a password reset email.

- **Endpoint**: `POST /api/auth/forgot-password`
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "If the email exists, a reset link has been sent"
  }
  ```

#### 5. Reset Password

Reset password using the token from email.

- **Endpoint**: `POST /api/auth/reset-password`
- **Body**:
  ```json
  {
    "token": "reset-token-from-email",
    "new_password": "newsecurepassword"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Password reset successfully"
  }
  ```

### Features

- **Role-Based Access Control**:
  - **CUSTOMER**: Can browse and book events.
  - **ORGANIZER**: Can create and manage events.
- **Referral System**:
  - Every new user gets a unique 8-character referral code.
  - Users can register with a referrer's code.
  - **Referral Rewards**:
    - New user with referral gets a **10% discount coupon** (valid 3 months).
    - Referrer gets **10,000 points** (expires in 3 months).

---

### Points (`/api/users/me/points`)

All endpoints require authentication.

#### 1. Get Points Balance

- **Endpoint**: `GET /api/users/me/points`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "total_balance": 30000,
    "points": [
      {
        "id": "...",
        "amount": 10000,
        "remaining_amount": 10000,
        "expires_at": "2026-05-07T04:38:00Z",
        "created_at": "2026-02-07T04:38:00Z"
      }
    ]
  }
  ```

#### 2. Get Points History

- **Endpoint**: `GET /api/users/me/points/history`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "history": [
      {
        "id": "...",
        "amount": 10000,
        "remaining_amount": 5000,
        "expires_at": "2026-05-07T04:38:00Z",
        "created_at": "2026-02-07T04:38:00Z",
        "is_expired": false
      }
    ]
  }
  ```

---

### Coupons (`/api/users/me/coupons`)

All endpoints require authentication.

#### 1. Get My Coupons

- **Endpoint**: `GET /api/users/me/coupons`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "coupons": [
      {
        "id": "...",
        "code": "REF-ABC12345",
        "discount_percentage": 10,
        "discount_amount": null,
        "valid_from": "2026-02-07T04:38:00Z",
        "valid_until": "2026-05-07T04:38:00Z",
        "is_used": false,
        "is_expired": false,
        "is_valid": true,
        "created_at": "2026-02-07T04:38:00Z"
      }
    ]
  }
  ```

#### 2. Validate Coupon

- **Endpoint**: `GET /api/users/me/coupons/validate/:code`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)** - Valid:
  ```json
  {
    "valid": true,
    "coupon": {
      "id": "...",
      "code": "REF-ABC12345",
      "discount_percentage": 10,
      "discount_amount": null,
      "valid_until": "2026-05-07T04:38:00Z"
    }
  }
  ```
- **Response (400)** - Invalid:
  ```json
  {
    "valid": false,
    "message": "Coupon has expired"
  }
  ```

---

### Profile (`/api/users/me/profile`)

All endpoints require authentication.

#### 1. Get Profile

- **Endpoint**: `GET /api/users/me/profile`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "profile": {
      "id": "...",
      "email": "user@example.com",
      "full_name": "John Doe",
      "phone_number": "08123456789",
      "profile_picture": "https://res.cloudinary.com/...",
      "role": "CUSTOMER",
      "referral_code": "ABC12345",
      "created_at": "2026-02-07T04:38:00Z",
      "updated_at": "2026-02-07T04:38:00Z"
    }
  }
  ```

#### 2. Update Profile

- **Endpoint**: `PUT /api/users/me/profile`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "full_name": "John Updated",
    "phone_number": "08987654321"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Profile updated successfully",
    "profile": { ... }
  }
  ```

#### 3. Update Profile Picture

Upload image using `multipart/form-data`.

- **Endpoint**: `PUT /api/users/me/profile/picture`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**: `multipart/form-data` with field `profile_picture` (image file)
- **Limits**: Max 5MB, JPEG/PNG/GIF/WebP only
- **Response (200)**:
  ```json
  {
    "message": "Profile picture updated successfully",
    "profile": {
      "id": "...",
      "profile_picture": "https://res.cloudinary.com/..."
    }
  }
  ```

#### 4. Change Password

- **Endpoint**: `PUT /api/users/me/profile/password`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "old_password": "currentpassword",
    "new_password": "newsecurepassword"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```

---

### Events (`/api/events`)

#### 1. List Events (Public)

Browse upcoming events with search, filters, sorting, and pagination.

- **Endpoint**: `GET /api/events`
- **Query Parameters**:
  | Parameter | Type | Description |
  |-----------|------|-------------|
  | `search` | string | Search in event name and description |
  | `category_id` | string (UUID) | Filter by category ID |
  | `city` | string | Filter by city |
  | `province` | string | Filter by province |
  | `is_free` | boolean | Filter free (`true`) or paid (`false`) events |
  | `min_price` | number | Minimum base price |
  | `max_price` | number | Maximum base price |
  | `start_date_from` | ISO date | Events starting after this date |
  | `start_date_to` | ISO date | Events starting before this date |
  | `page` | number | Page number (default: 1) |
  | `limit` | number | Items per page (default: 10, max: 100) |
  | `sort_by` | string | `start_date`, `name`, `base_price`, `created_at` |
  | `sort_order` | string | `asc` or `desc` |

- **Response (200)**:
  ```json
  {
    "data": [ { "id": "...", "name": "...", ... } ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
  ```

#### 2. Get Event Details (Public)

- **Endpoint**: `GET /api/events/:id`
- **Response (200)**:
  ```json
  {
    "data": {
      "id": "...",
      "name": "Event Name",
      "description": "...",
      "category_id": "category-uuid",
      "category": { "id": "category-uuid", "name": "Music" },
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "start_date": "2026-03-01T10:00:00Z",
      "end_date": "2026-03-01T22:00:00Z",
      "total_seats": 1000,
      "available_seats": 800,
      "base_price": "150000.00",
      "is_free": false,
      "organizer": { "id": "...", "full_name": "..." },
      "ticket_types": [...],
      "promotions": [...],
      "reviews": [...],
      "average_rating": 4.5,
      "_count": { "reviews": 25 }
    }
  }
  ```

#### 3. Create Event (ORGANIZER only)

- **Endpoint**: `POST /api/events`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "name": "Music Festival 2026",
    "description": "Annual music festival...",
    "category_id": "category-uuid",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "start_date": "2026-03-01T10:00:00Z",
    "end_date": "2026-03-01T22:00:00Z",
    "total_seats": 1000,
    "base_price": 150000,
    "is_free": false,
    "image": "https://example.com/image.jpg",
    "ticket_types": [
      { "name": "Regular", "price": 150000, "quantity": 800 },
      {
        "name": "VIP",
        "price": 500000,
        "quantity": 200,
        "description": "Front row access"
      }
    ]
  }
  ```
- **Validation** (handled by `express-validator` middleware):

  | Field                     | Rule                                                 |
  | ------------------------- | ---------------------------------------------------- |
  | `name`                    | Required, non-empty string, trimmed                  |
  | `description`             | Required, non-empty string, trimmed                  |
  | `category_id`             | Required, valid UUID                                 |
  | `start_date`              | Required, valid ISO 8601, must be in the future      |
  | `end_date`                | Required, valid ISO 8601, must be after `start_date` |
  | `total_seats`             | Required, integer ≥ 1                                |
  | `base_price`              | Required, float ≥ 0                                  |
  | `is_free`                 | Optional, boolean                                    |
  | `ticket_types`            | Optional array                                       |
  | `ticket_types.*.name`     | Required, non-empty string                           |
  | `ticket_types.*.price`    | Required, float ≥ 0                                  |
  | `ticket_types.*.quantity` | Required, integer ≥ 1                                |

- **Response (400)** — Validation Error:
  ```json
  {
    "message": "Validation failed",
    "errors": [
      {
        "type": "field",
        "msg": "Name is required",
        "path": "name",
        "location": "body"
      }
    ]
  }
  ```
- **Response (201)**:
  ```json
  {
    "message": "Event created successfully",
    "data": { ... }
  }
  ```

#### 4. Update Event (Owner only)

- **Endpoint**: `PUT /api/events/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**: Any fields to update (same as create, except `ticket_types`)
- **Response (200)**:
  ```json
  {
    "message": "Event updated successfully",
    "data": { ... }
  }
  ```

#### 5. Delete Event (Owner only)

Soft deletes the event (sets `deleted_at`).

- **Endpoint**: `DELETE /api/events/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Event deleted successfully"
  }
  ```

#### 6. Get My Events (ORGANIZER only)

- **Endpoint**: `GET /api/events/organizer/my-events`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**: `page`, `limit`, `sort_by`, `sort_order`

#### 7. Get Locations (Public)

- **Endpoint**: `GET /api/events/meta/locations`
- **Response (200)**:
  ```json
  {
    "data": [
      { "city": "Jakarta", "province": "DKI Jakarta" },
      { "city": "Bandung", "province": "Jawa Barat" }
    ]
  }
  ```

---

### Event Categories (`/api/categories`)

#### 1. List Categories (Public)

- **Endpoint**: `GET /api/categories`
- **Response (200)**:
  ```json
  {
    "data": [
      {
        "id": "category-uuid",
        "name": "Music",
        "created_at": "2026-02-14T10:00:00Z",
        "updated_at": "2026-02-14T10:00:00Z"
      }
    ]
  }
  ```

#### 2. Get Category by ID (Public)

- **Endpoint**: `GET /api/categories/:id`
- **Response (200)**:
  ```json
  {
    "data": {
      "id": "category-uuid",
      "name": "Music",
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-14T10:00:00Z",
      "_count": { "events": 5 }
    }
  }
  ```

#### 3. Create Category (ORGANIZER only)

- **Endpoint**: `POST /api/categories`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "name": "Music"
  }
  ```
- **Response (201)**:
  ```json
  {
    "message": "Category created successfully",
    "data": { "id": "...", "name": "Music", ... }
  }
  ```
- **Response (409)**: `"Category with this name already exists"`

#### 4. Update Category (ORGANIZER only)

- **Endpoint**: `PUT /api/categories/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "name": "Updated Name"
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Category updated successfully",
    "data": { ... }
  }
  ```

#### 5. Delete Category (ORGANIZER only)

Cannot delete if category is still used by events.

- **Endpoint**: `DELETE /api/categories/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Category deleted successfully"
  }
  ```
- **Response (400)**: `"Cannot delete category that is still used by events"`

---

### Ticket Types (`/api/events/:eventId/tickets`)

#### 1. List Ticket Types (Public)

- **Endpoint**: `GET /api/events/:eventId/tickets`
- **Response (200)**:
  ```json
  {
    "data": [
      {
        "id": "...",
        "name": "Regular",
        "description": null,
        "price": "150000.00",
        "quantity": 800,
        "available_quantity": 750
      }
    ]
  }
  ```

#### 2. Create Ticket Type (Owner only)

- **Endpoint**: `POST /api/events/:eventId/tickets`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "name": "VIP",
    "description": "Front row access",
    "price": 500000,
    "quantity": 100
  }
  ```
- **Response (201)**:
  ```json
  {
    "message": "Ticket type created successfully",
    "data": { ... }
  }
  ```

#### 3. Update Ticket Type (Owner only)

- **Endpoint**: `PUT /api/events/:eventId/tickets/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**: Any fields to update
- **Response (200)**:
  ```json
  {
    "message": "Ticket type updated successfully",
    "data": { ... }
  }
  ```

#### 4. Delete Ticket Type (Owner only)

Cannot delete if tickets have been sold.

- **Endpoint**: `DELETE /api/events/:eventId/tickets/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Ticket type deleted successfully"
  }
  ```

---

### Promotions (`/api/events/:eventId/promotions`)

#### 1. List Promotions (Public)

- **Endpoint**: `GET /api/events/:eventId/promotions`
- **Response (200)**:
  ```json
  {
    "data": [
      {
        "id": "...",
        "code": "EARLYBIRD20",
        "discount_percentage": "20.00",
        "discount_amount": null,
        "max_usage": 100,
        "current_usage": 25,
        "valid_from": "2026-01-01T00:00:00Z",
        "valid_until": "2026-02-28T23:59:59Z"
      }
    ]
  }
  ```

#### 2. Create Promotion (Owner only)

- **Endpoint**: `POST /api/events/:eventId/promotions`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:

  ```json
  {
    "code": "EARLYBIRD20",
    "discount_percentage": 20,
    "max_usage": 100,
    "valid_from": "2026-01-01T00:00:00Z",
    "valid_until": "2026-02-28T23:59:59Z"
  }
  ```

  > Note: Provide either `discount_percentage` (0-100) OR `discount_amount`. If `code` is omitted, it will be auto-generated.

- **Validation** (handled by `express-validator` middleware):

  | Field                  | Rule                                                       |
  | ---------------------- | ---------------------------------------------------------- |
  | `code`                 | Optional, alphanumeric, 3–20 characters                    |
  | `discount_percentage`  | Optional, float between 0.01 and 100                       |
  | `discount_amount`      | Optional, float greater than 0                             |
  | _(body-level)_         | At least one of `discount_percentage` or `discount_amount` |
  | `max_usage`            | Required, integer ≥ 1                                      |
  | `valid_from`           | Required, valid ISO 8601 date                              |
  | `valid_until`          | Required, valid ISO 8601 date, must be after `valid_from`  |

- **Response (400)** — Validation Error:
  ```json
  {
    "message": "Validation failed",
    "errors": [
      {
        "type": "field",
        "msg": "Max usage must be at least 1",
        "path": "max_usage",
        "location": "body"
      }
    ]
  }
  ```
- **Response (201)**:
  ```json
  {
    "message": "Promotion created successfully",
    "data": { ... }
  }
  ```

#### 3. Update Promotion (Owner only)

- **Endpoint**: `PUT /api/events/:eventId/promotions/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**: Any fields to update
- **Validation** (handled by `express-validator` middleware):

  | Field                 | Rule                                                      |
  | --------------------- | --------------------------------------------------------- |
  | `code`                | Optional, alphanumeric, 3–20 characters                   |
  | `discount_percentage` | Optional, float between 0.01 and 100                      |
  | `discount_amount`     | Optional, float greater than 0                            |
  | `max_usage`           | Optional, integer ≥ 1                                     |
  | `valid_from`          | Optional, valid ISO 8601 date                             |
  | `valid_until`         | Optional, valid ISO 8601 date, must be after `valid_from` |
- **Response (200)**:
  ```json
  {
    "message": "Promotion updated successfully",
    "data": { ... }
  }
  ```

#### 4. Delete Promotion (Owner only)

Cannot delete if promotion has been used.

- **Endpoint**: `DELETE /api/events/:eventId/promotions/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Promotion deleted successfully"
  }
  ```


---

### Transactions (`/api/transactions`)

#### Transaction Statuses

| Status                 | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| `WAITING_PAYMENT`      | Transaction created, awaiting payment proof (2-hour deadline)             |
| `WAITING_CONFIRMATION` | Payment proof uploaded, awaiting organizer review                         |
| `DONE`                 | Transaction completed successfully                                        |
| `REJECTED`             | Rejected by organizer                                                     |
| `EXPIRED`              | No payment proof uploaded within 2 hours                                  |
| `CANCELLED`            | Cancelled by user or auto-cancelled after 3 days without organizer action |

#### 1. Create Transaction (CUSTOMER only)

Purchase event tickets with optional discounts.

- **Endpoint**: `POST /api/transactions`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:

  ```json
  {
    "event_id": "event-uuid",
    "items": [{ "ticket_type_id": "ticket-uuid", "quantity": 2 }],
    "promotion_code": "EARLYBIRD20",
    "coupon_code": "REF-ABC123",
    "points_to_use": 10000
  }
  ```

  > **Mutual Exclusivity**: Only **one** discount option can be used per transaction — `promotion_code`, `coupon_code`, or `points_to_use`. Providing more than one will return a `400` validation error.

  > All prices are in **IDR**. Points reduce the final amount (1 point = 1 IDR).

- **Validation** (handled by `express-validator` middleware):

  | Field                    | Rule                                  |
  | ------------------------ | ------------------------------------- |
  | `event_id`               | Required, non-empty string, trimmed   |
  | `items`                  | Required, non-empty array             |
  | `items.*.ticket_type_id` | Required, non-empty string, trimmed   |
  | `items.*.quantity`       | Required, integer ≥ 1                 |
  | `promotion_code`         | Optional, trimmed string              |
  | `coupon_code`            | Optional, trimmed string              |
  | `points_to_use`          | Optional, integer ≥ 0                 |

- **Response (400)** — Validation Error:
  ```json
  {
    "message": "Validation failed",
    "errors": [
      {
        "type": "field",
        "msg": "event_id is required",
        "path": "event_id",
        "location": "body"
      }
    ]
  }
  ```
- **Response (201)**:
  ```json
  {
    "message": "Transaction created successfully",
    "data": {
      "id": "...",
      "invoice_number": "INV-20260207-ABC123",
      "total_amount": 300000,
      "discount_amount": 60000,
      "points_used": 10000,
      "final_amount": 230000,
      "status": "WAITING_PAYMENT",
      "payment_deadline": "2026-02-07T17:00:00Z",
      "time_remaining_seconds": 7200,
      "items": [...],
      "event": {...}
    }
  }
  ```

#### 2. Upload Payment Proof (CUSTOMER only)

Upload payment proof image after making payment. Must be done within 2 hours. The image is automatically uploaded to Cloudinary.

- **Endpoint**: `POST /api/transactions/:id/payment-proof`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**: `multipart/form-data` with field `payment_proof` (image file)
- **Limits**: Max 5MB, JPEG/PNG/GIF/WebP only
- **Response (200)**:
  ```json
  {
    "message": "Payment proof uploaded successfully",
    "data": {
      "id": "...",
      "status": "WAITING_CONFIRMATION",
      "payment_proof": "https://res.cloudinary.com/.../payment_xxx.jpg"
    }
  }
  ```

#### 3. Cancel Transaction (CUSTOMER only)

Cancel a transaction before payment proof is uploaded.

- **Endpoint**: `POST /api/transactions/:id/cancel`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Transaction cancelled successfully",
    "data": { "id": "...", "status": "CANCELLED" }
  }
  ```
  > Points, coupons, and seats are automatically restored.

#### 4. Get My Transactions (CUSTOMER only)

- **Endpoint**: `GET /api/transactions/me`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**: `page`, `limit`, `status`, `date_from`, `date_to`
- **Response (200)**:
  ```json
  {
    "data": [...],
    "pagination": { "page": 1, "limit": 10, "total": 25, "total_pages": 3 }
  }
  ```

#### 5. Get Transaction Details (CUSTOMER/ORGANIZER)

- **Endpoint**: `GET /api/transactions/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "data": {
      "id": "...",
      "invoice_number": "INV-20260207-ABC123",
      "status": "WAITING_PAYMENT",
      "time_remaining_seconds": 3600,
      "event": {...},
      "items": [...],
      "promotion": {...},
      "coupon": {...}
    }
  }
  ```

#### 6. Get Organizer Transactions (ORGANIZER only)

List transactions for events you organize.

- **Endpoint**: `GET /api/transactions/organizer/list`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**: `page`, `limit`, `event_id`, `status`, `date_from`, `date_to`
- **Response (200)**:
  ```json
  {
    "data": [...],
    "pagination": { "page": 1, "limit": 10, "total": 50, "total_pages": 5 }
  }
  ```

#### 7. Accept/Reject Transaction (ORGANIZER only)

- **Endpoint**: `PUT /api/transactions/:id/status`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:

  ```json
  {
    "status": "DONE",
    "rejection_reason": "Optional reason if rejecting"
  }
  ```

- **Validation** (handled by `express-validator` middleware):

  | Field              | Rule                                                     |
  | ------------------ | -------------------------------------------------------- |
  | `status`           | Required, must be `"DONE"` or `"REJECTED"`               |
  | `rejection_reason` | Optional (required when `status` is `"REJECTED"`), trimmed |

- **Response (400)** — Validation Error:
  ```json
  {
    "message": "Validation failed",
    "errors": [
      {
        "type": "field",
        "msg": "status must be either 'DONE' or 'REJECTED'",
        "path": "status",
        "location": "body"
      }
    ]
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Transaction accepted successfully",
    "data": { "id": "...", "status": "DONE" }
  }
  ```
  > If rejected, points, coupons, and seats are automatically restored.

#### Automatic Status Changes

The backend runs a scheduler that:

- **Expires** transactions after 2 hours if no payment proof is uploaded
- **Cancels** transactions after 3 days if organizer doesn't accept/reject

Both cases trigger automatic **rollback** of:

- Ticket seat availability
- User points (refunded with 3-month expiry)
- Coupon usage status
- Promotion usage count

---

### Dashboard (`/api/dashboard`)

All dashboard endpoints require `ORGANIZER` role authentication.

#### 1. Get Dashboard Overview

Get summary statistics for the organizer.

- **Endpoint**: `GET /api/dashboard/overview`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Dashboard overview retrieved successfully",
    "data": {
      "total_events": 10,
      "total_transactions": 150,
      "total_revenue": 15000000,
      "pending_confirmations": 5,
      "upcoming_events": 3,
      "completed_transactions": 140
    }
  }
  ```

#### 2. Get Event Statistics

Get statistics by time period (grouped by year, month, or day).

- **Endpoint**: `GET /api/dashboard/statistics`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**:
  | Parameter | Type | Description |
  |-----------|------|-------------|
  | `year` | number | Filter by year (e.g., 2026) |
  | `month` | number | Filter by month (1-12), requires `year` |

- **Response (200)**:
  ```json
  {
    "message": "Statistics retrieved successfully",
    "data": [
      {
        "period": "2026-02",
        "total_transactions": 25,
        "total_revenue": 3500000,
        "total_tickets_sold": 50
      }
    ],
    "filters": {
      "year": 2026,
      "month": null,
      "grouping": "monthly"
    }
  }
  ```

#### 3. Get Revenue Report

Get revenue breakdown by event.

- **Endpoint**: `GET /api/dashboard/revenue`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**:
  | Parameter | Type | Description |
  |-----------|------|-------------|
  | `year` | number | Filter by year |
  | `month` | number | Filter by month (1-12), requires `year` |
  | `event_id` | string | Filter by specific event |

- **Response (200)**:
  ```json
  {
    "message": "Revenue report retrieved successfully",
    "data": {
      "by_event": [
        {
          "event_id": "...",
          "event_name": "Music Festival 2026",
          "total_revenue": 5000000,
          "total_tickets_sold": 100,
          "transaction_count": 50
        }
      ],
      "total_revenue": 15000000,
      "total_tickets_sold": 300,
      "total_transactions": 150
    }
  }
  ```

---

### Attendee List (`/api/events/:id/attendees`)

#### Get Event Attendees (ORGANIZER only)

Get the list of attendees for a specific event.

- **Endpoint**: `GET /api/events/:id/attendees`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**: `page`, `limit`
- **Response (200)**:
  ```json
  {
    "message": "Attendees retrieved successfully",
    "data": [
      {
        "id": "transaction-id",
        "invoice_number": "INV-20260207-ABC123",
        "attendee": {
          "id": "user-id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "tickets": [
          {
            "type": "VIP",
            "quantity": 2,
            "price_per_ticket": 500000,
            "subtotal": 1000000
          }
        ],
        "total_tickets": 2,
        "total_paid": 1000000,
        "purchased_at": "2026-02-07T10:30:00Z"
      }
    ],
    "event": {
      "id": "...",
      "name": "Music Festival 2026",
      "start_date": "2026-03-01T10:00:00Z"
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "total_pages": 3
    }
  }
  ```

---

### Reviews and Ratings (`/api`)

Customers can leave reviews and ratings only after attending an event (completed transaction + event has ended). Ratings and reviews are shown on the event organizer's profile.

#### 1. Create Review (CUSTOMER only)

Leave a review for an event you've attended.

- **Endpoint**: `POST /api/reviews`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:

  ```json
  {
    "event_id": "event-uuid",
    "rating": 5,
    "comment": "Amazing event! The organization was perfect and the venue was great."
  }
  ```

  > **Rating**: 1-5 stars. **Comment**: Minimum 10 characters. **Eligibility**: Must have completed transaction AND event has ended.

- **Response (201)**:

  ```json
  {
    "message": "Review created successfully",
    "data": {
      "id": "review-uuid",
      "rating": 5,
      "comment": "Amazing event! The organization was perfect...",
      "created_at": "2026-03-02T10:00:00Z",
      "user": {
        "id": "...",
        "full_name": "John Doe",
        "profile_picture": "..."
      },
      "event": { "id": "...", "name": "Music Festival 2026" }
    }
  }
  ```

- **Error Responses**:
  - `400`: "You can only review events that you have attended and that have ended"
  - `400`: "You have already reviewed this event"

#### 2. Update Review (Owner only)

- **Endpoint**: `PUT /api/reviews/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Body**:
  ```json
  {
    "rating": 4,
    "comment": "Updated review comment with more details..."
  }
  ```
- **Response (200)**:
  ```json
  {
    "message": "Review updated successfully",
    "data": { ... }
  }
  ```

#### 3. Delete Review (Owner only)

- **Endpoint**: `DELETE /api/reviews/:id`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "message": "Review deleted successfully"
  }
  ```

#### 4. Get Event Reviews (Public)

Get all reviews for a specific event with pagination.

- **Endpoint**: `GET /api/events/:eventId/reviews`
- **Query Parameters**:
  | Parameter | Type | Description |
  |-----------|------|-------------|
  | `page` | number | Page number (default: 1) |
  | `limit` | number | Items per page (default: 10, max: 50) |
  | `sort_by` | string | `created_at` or `rating` |
  | `sort_order` | string | `asc` or `desc` |

- **Response (200)**:
  ```json
  {
    "data": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Amazing event!",
        "created_at": "2026-03-02T10:00:00Z",
        "user": {
          "id": "...",
          "full_name": "John Doe",
          "profile_picture": "..."
        }
      }
    ],
    "stats": {
      "average_rating": 4.5,
      "total_reviews": 25
    },
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
  ```

#### 5. Get Event Review Statistics (Public)

Get rating distribution for an event.

- **Endpoint**: `GET /api/events/:eventId/reviews/stats`
- **Response (200)**:
  ```json
  {
    "data": {
      "average_rating": 4.5,
      "total_reviews": 25,
      "rating_distribution": {
        "5": 15,
        "4": 6,
        "3": 3,
        "2": 1,
        "1": 0
      }
    }
  }
  ```

#### 6. Get Organizer Profile with Reviews (Public)

Get organizer profile with aggregated ratings across all their events.

- **Endpoint**: `GET /api/organizers/:organizerId/reviews`
- **Response (200)**:
  ```json
  {
    "data": {
      "organizer": {
        "id": "organizer-uuid",
        "full_name": "Event Corp",
        "profile_picture": "https://...",
        "email": "organizer@example.com",
        "created_at": "2025-01-01T00:00:00Z",
        "total_events": 10
      },
      "review_summary": {
        "average_rating": 4.7,
        "total_reviews": 150,
        "rating_distribution": { "5": 100, "4": 30, "3": 15, "2": 3, "1": 2 }
      },
      "recent_reviews": [
        {
          "id": "...",
          "rating": 5,
          "comment": "Great organizer!",
          "user": { "id": "...", "full_name": "..." },
          "event": { "id": "...", "name": "..." }
        }
      ]
    }
  }
  ```

#### 7. Get My Reviews (CUSTOMER only)

Get the logged-in user's reviews.

- **Endpoint**: `GET /api/users/me/reviews`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Query Parameters**: `page`, `limit`, `sort_by`, `sort_order`
- **Response (200)**:
  ```json
  {
    "data": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Amazing event!",
        "created_at": "2026-03-02T10:00:00Z",
        "event": {
          "id": "...",
          "name": "Music Festival 2026",
          "image": "https://...",
          "start_date": "2026-03-01T10:00:00Z",
          "end_date": "2026-03-01T22:00:00Z"
        }
      }
    ],
    "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
  }
  ```

#### 8. Check Review Eligibility (CUSTOMER only)

Check if the user can review a specific event.

- **Endpoint**: `GET /api/events/:eventId/reviews/eligibility`
- **Headers**: `Authorization: Bearer <token>` or Cookie
- **Response (200)**:
  ```json
  {
    "data": {
      "can_review": true,
      "has_attended": true,
      "has_existing_review": false
    }
  }
  ```

---

### Email Notifications

The system automatically sends email notifications to customers when:

#### Transaction Accepted

When organizer accepts a transaction (status → `DONE`):

- Customer receives confirmation email with:
  - Event name and date
  - Ticket details (type, quantity, price)
  - Total amount paid
  - Instructions to present at event entrance

#### Transaction Rejected

When organizer rejects a transaction (status → `REJECTED`):

- Customer receives rejection email with:
  - Reason for rejection (if provided)
  - Refund details:
    - Points refunded (with 3-month expiry)
    - Coupon restored (if used)
    - Seats released back to availability

---

### Error Responses

All endpoints return errors in this format:

```json
{
  "message": "Error description"
}
```

Common HTTP status codes:

- `400` - Bad Request (validation error, invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
