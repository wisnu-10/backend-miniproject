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
