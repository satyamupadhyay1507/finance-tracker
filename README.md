# Personal Finance Tracker

This is a full-stack personal finance management application that I built. It uses React for the frontend and Node.js for the backend. The database is MySQL and I also used Redis for caching.

## Features I Implemented
- User Auth (login and signup with JWT)
- Role Based Access (admin, user, read-only)
- Add, Edit, Delete transactions (income/expense in Rupees ₹)
- Dashboard with Monthly and Yearly charts
- Pagination and Virtual Scrolling for transaction lists
- Modern Glassmorphism UI (looks really premium!)
- Swagger API Documentation

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, Recharts, React-Window (for virtual scrolling)
- **Backend:** Node.js, Express, Swagger
- **Database:** MySQL
- **Caching:** Redis

## How to run locally

### 1. Setup Database
First you need to create the database in mysql using the schema provided.
```bash
mysql -u root -p < database/schema.sql
```

### 2. Start Redis (Optional)
Make sure redis is running locally if you want caching to work. But don't worry, the app will still work fine without it! (I added a safe fallback).
```bash
redis-server
```

### 3. Run Backend
Go to the server folder and start it up.
```bash
cd server
npm install
npm run dev
```
Note: You need to create a `.env` file with your db password and JWT secret before running.

### 4. Run Frontend
In a new terminal window:
```bash
cd client
npm install
npm run dev
```

## Demo accounts to test
- admin@demo.com / password123
- user@demo.com / password123
- readonly@demo.com / password123

## API Documentation
You can view the Swagger API documentation by going to `http://localhost:5001/api-docs` when the server is running.

## Performance Metrics & Optimizations
- **React.lazy()** is used for route-based code splitting so pages load fast.
- **useMemo and useCallback** are used heavily to optimize chart rendering and avoid unnecessary component re-renders (learned this the hard way).
- **Virtual Scrolling:** Implemented using `react-window` in the Transactions page so it can handle thousands of rows without lagging the browser.
- **Redis Caching:** 
  - Analytics data cached for 15 minutes.
  - Categories cached for 1 hour.
  - Cache is invalidated on transaction updates.
- **Rate Limiting:** Auth routes restricted to 5/15m to prevent brute force attacks.
