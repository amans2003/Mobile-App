# ShopLite - Full-Stack E-Commerce Application

A complete full-stack e-commerce application with a **React Native mobile app**, **React web admin panel**, and a shared **Node.js + Express backend** using **MongoDB**.

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB Atlas** + **Mongoose**
- **JWT Authentication**
- **bcryptjs** for password hashing
- **Multer** for image uploads
- **CORS** enabled

### Admin Panel
- **React.js** (Vite)
- **Tailwind CSS**
- **React Router DOM**
- **Axios**

### Mobile App
- **React Native** (Expo)
- **React Navigation**
- **Axios**
- **AsyncStorage**

---

## 📁 Project Structure

```
shoplite/
├── backend/          # Node.js + Express API
│   ├── config/       # Database configuration
│   ├── controllers/  # Request handlers
│   ├── middleware/    # Auth & admin middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   ├── uploads/      # Uploaded product images
│   ├── server.js     # Entry point
│   └── seed.js       # Admin seeder script
├── admin/            # React Admin Panel (Vite)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── mobile/           # React Native Mobile App (Expo)
    └── src/
        ├── components/
        ├── context/
        ├── navigation/
        ├── screens/
        └── services/
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB Atlas** account (or local MongoDB)
- **Expo CLI** (for mobile development)

### 1. Backend Setup

```bash
cd shoplite/backend

# Copy environment variables
cp .env.example .env

# Update .env with your MongoDB connection string and JWT secret
# MONGO_URI=your_mongodb_atlas_uri
# JWT_SECRET=your_secret_key

# Install dependencies
npm install

# Seed the admin account
node seed.js

# Start the server
npm run dev
```

The backend server will start on `http://localhost:5001`.

### 2. Admin Panel Setup

```bash
cd shoplite/admin

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The admin panel will be available at `http://localhost:5173`.

### 3. Mobile App Setup

```bash
cd shoplite/mobile

# Install dependencies
npm install

# Start Expo
npx expo start
```

Scan the QR code with the Expo Go app or run on a simulator.

> **Note:** If running on a physical device, update the `API_BASE_URL` in `mobile/src/services/api.js` with your machine's local IP address instead of `localhost`.

---

## 🔑 Default Admin Credentials

| Field    | Value              |
|----------|--------------------|
| Email    | admin@example.com  |
| Password | Admin@123          |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint             | Description      | Access |
|--------|----------------------|------------------|--------|
| POST   | `/api/auth/register` | Register user    | Public |
| POST   | `/api/auth/login`    | Login user       | Public |

### Products
| Method | Endpoint              | Description        | Access |
|--------|-----------------------|--------------------|--------|
| GET    | `/api/products`       | Get all products   | Public |
| GET    | `/api/products/:id`   | Get product by ID  | Public |
| POST   | `/api/products`       | Create product     | Admin  |
| PUT    | `/api/products/:id`   | Update product     | Admin  |
| DELETE | `/api/products/:id`   | Delete product     | Admin  |

### Users
| Method | Endpoint            | Description     | Access |
|--------|---------------------|-----------------|--------|
| GET    | `/api/users`        | Get all users   | Admin  |
| GET    | `/api/users/count`  | Get user count  | Admin  |

---

## ✨ Features

- ✅ JWT Authentication (login/register)
- ✅ Password hashing with bcrypt
- ✅ Protected routes (Admin-only middleware)
- ✅ Product CRUD with image upload
- ✅ User management
- ✅ Admin dashboard with metrics
- ✅ Mobile product browsing
- ✅ User profile with logout
- ✅ Pull-to-refresh on mobile
- ✅ Error handling and validation
- ✅ Responsive admin UI
- ✅ Modern, minimal design

---

## 📝 License

This project is for educational and portfolio purposes.
