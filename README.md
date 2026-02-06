# Mini Project V2 - Backend

This is the backend service for the Mini Project V2 application, built with Node.js, Express, TypeScript, and Prisma. It handles user authentication, event management, and transactions.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & Cookies (HttpOnly)
- **Validation**: Zod (planned/in-progress) or Manual

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

### Features

- **Role-Based Access Control**:
  - **CUSTOMER**: Can browse and book events.
  - **ORGANIZER**: Can create and manage events.
- **Referral System**:
  - Every new user gets a unique 8-character referral code.
  - Users can register with a referrer's code.

---

### Events (`/api/events`)

#### 1. List Events (Public)

Browse upcoming events with search, filters, sorting, and pagination.

- **Endpoint**: `GET /api/events`
- **Query Parameters**:
  | Parameter | Type | Description |
  |-----------|------|-------------|
  | `search` | string | Search in event name and description |
  | `category` | string | Filter by category |
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
      "category": "Music",
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
    "category": "Music",
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
      { "name": "VIP", "price": 500000, "quantity": 200, "description": "Front row access" }
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

#### 7. Get Categories (Public)

- **Endpoint**: `GET /api/events/meta/categories`
- **Response (200)**:
  ```json
  {
    "data": ["Music", "Technology", "Sports", ...]
  }
  ```

#### 8. Get Locations (Public)

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

#### 5. Validate Promotion Code (Public)

- **Endpoint**: `POST /api/promotions/validate`
- **Body**:
  ```json
  {
    "code": "EARLYBIRD20",
    "event_id": "event-uuid-here"
  }
  ```
- **Response (200)** - Valid:
  ```json
  {
    "valid": true,
    "promotion": {
      "id": "...",
      "code": "EARLYBIRD20",
      "discount_percentage": "20.00",
      "discount_amount": null,
      "remaining_usage": 75
    },
    "event": { "id": "...", "name": "...", "base_price": "150000.00" }
  }
  ```
- **Response (400)** - Invalid:
  ```json
  {
    "valid": false,
    "message": "Invalid or expired promotion code"
  }
  ```

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

