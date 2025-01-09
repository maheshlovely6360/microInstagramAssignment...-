# Micro Instagram Backend

A simple backend implementation for a micro Instagram-like application using Node.js, Express, and SQLite.

## Features

- User registration and authentication using JWT
- Create, read, update, and delete posts
- Image handling (stored as JSON array of strings)
- User post count tracking
- RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/micro-instagram-backend.git
cd micro-instagram-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create .env file with following variables:
```
JWT_SECRET=your_jwt_secret_key
DB_PATH=./database.sqlite
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST /api/register - Register a new user
- POST /api/login - Login and get JWT token

### Users
- GET /api/users - Get all users

### Posts
- GET /api/posts - Get all posts
- POST /api/posts - Create a new post
- PUT /api/posts/:id - Update a post
- DELETE /api/posts/:id - Delete a post
- GET /api/users/:userId/posts - Get all posts for a specific user

## Testing

Run tests using:
```bash
npm test
```

## Database Schema

### Users Table
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- name (VARCHAR(256))
- mobile_number (TEXT UNIQUE)
- address (TEXT)
- post_count (INTEGER)
- password (TEXT)

### Posts Table
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- title (TEXT)
- description (TEXT)
- user_id (INTEGER FOREIGN KEY)
- images (TEXT - JSON array of strings)
