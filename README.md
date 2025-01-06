# User and Post Management API

This RESTful API allows for efficient management of users and posts. The project includes functionality for managing users, creating posts, and retrieving posts. Efficient database operations are implemented to ensure the system scales well.

## Features

- User model with `post_count` that auto-updates on post creation.
- Post model with images and descriptions linked to a user.
- RESTful API endpoints for creating, editing, deleting posts, and retrieving posts and users.

## Models

### User Model

The `User` model stores the following fields:

- **Id**: Auto-incrementing primary key (Integer).
- **Name**: Name of the user (String, max 256 characters).
- **Mobile Number**: Unique mobile number for the user (BigInteger).
- **Address**: User's address (Text).
- **Post Count**: Tracks the number of posts made by the user (Integer, auto-incremented).

### Post Model

The `Post` model stores the following fields:

- **Id**: Auto-incrementing primary key (Integer).
- **Title**: Title of the post (Text).
- **Description**: Description of the post (Text).
- **User ID**: Foreign key referencing the `User` model.
- **Images**: JSON array of image paths/URLs (Array of Strings).

## Database Schema

**User Table:**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(256) NOT NULL,
    mobile_number BIGINT UNIQUE NOT NULL,
    address TEXT,
    post_count INT DEFAULT 0
);

Post Table:

sql
Copy code
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id INT,
    images JSON,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
API Endpoints
1. Get All Posts of a User
GET /users/{userId}/posts

Retrieves all posts for the given user, with pagination support for scalability.
Example:
bash
Copy code
GET /users/1/posts
2. Create a Post for a User
POST /users/{userId}/posts

Creates a new post and increments the post count of the user atomically.
Request Body:
json
Copy code
{
  "title": "New Post Title",
  "description": "Description of the new post",
  "images": ["image1.jpg", "image2.jpg"]
}
Example:
bash
Copy code
POST /users/1/posts
3. Edit a Post of a User
PUT /users/{userId}/posts/{postId}

Edits an existing post. Requires authentication (optional but recommended).
Request Body:
json
Copy code
{
  "title": "Updated Title",
  "description": "Updated description",
  "images": ["new_image.jpg"]
}
Example:
bash
Copy code
PUT /users/1/posts/2
4. Delete a Post of a User
DELETE /users/{userId}/posts/{postId}

Deletes the specified post and reduces the user's post count.
Example:
bash
Copy code
DELETE /users/1/posts/2
5. Get All Users
GET /users

Retrieves a list of all users.
Example:
bash
Copy code
GET /users
6. Get All Posts (Paginated)
GET /posts

Retrieves all posts across all users with pagination support for scalability.
Example:
bash
Copy code
GET /posts?page=1&limit=10