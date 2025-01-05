const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "database.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/users/:userId/posts'", async (request, response) => {
  const { userId } = request.params;
  const getUserPosts = `
  SELECT 
      * 
  FROM 
      posts 
  WHERE 
      user_id =${userId} `;
  const usersArray = await db.all(getUserPosts);
  response.send(usersArray);
});


app.post('/users/:userId/posts', (request, response) => {
  const userId = request.params.userId;
  const { title, description, images } = request.body;

  // Insert the new post into the Posts table
  const query = `INSERT INTO posts (Title, Description, User_ID, Images) VALUES ('${title}', '${description}', '${userId}', '${images}')`;
  const params = [title, description, userId, JSON.stringify(images)];

  db.run(query, params, function(error) {
    if (error) {
      return response.status(500).json({ message: 'Error creating post' });
    }

    // Increment the user's post count
    const updateUserQuery = `UPDATE Users SET Post_Count = Post_Count + 1 WHERE Id = ${userId}}`;
    db.run(updateUserQuery, [userId], (updateErr) => {
      if (updateErr) {
        return response.status(500).json({ message: 'Error updating post count' });
      }
      response.status(201).json({ message: 'Post created successfully', postId: this.lastID });
    });
  });
});

app.put('/users/:userId/posts/:postId', (request, response) => {
  const userId = request.params.userId;
  const postId = request.params.postId;
  const { title, description, images } = request.body;

  const query = `UPDATE posts SET Title = '${title}', Description = '${description}', Images = '${images}' WHERE Id = '${postId}' AND User_ID = '${userId}'`;
  const params = [title, description, JSON.stringify(images), postId, userId];

  db.run(query, params, function(error) {
    if (error) {
      return response.status(500).json({ message: 'Error updating post' });
    }

    if (this.changes === 0) {
      return response.status(404).json({ message: 'Post not found or does not belong to user' });
    }

    response.json({ message: 'Post updated successfully' });
  });
});


// 4. Delete a post of a user
app.delete('/users/:userId/posts/:postId', (request, response) => {
  const userId = request.params.userId;
  const postId = request.params.postId;

  // Delete the post
  const query = `DELETE FROM posts WHERE Id = ${postId} AND User_ID = ${userId}`;
  db.run(query, [postId, userId], function(error) {
    if (error) {
      return response.status(500).json({ message: 'Error deleting post' });
    }

    if (this.changes === 0) {
      return response.status(404).json({ message: 'Post not found or does not belong to user' });
    }

    // Decrement the user's post count
    const updateUserQuery = `UPDATE users SET Post_Count = Post_Count - 1 WHERE Id = ${postId}`;
    db.run(updateUserQuery, [userId], (updateErr) => {
      if (updateErr) {
        return response.status(500).json({ message: 'Error updating post count' });
      }
      response.json({ message: 'Post deleted successfully' });
    });
  });
});


// 5. Get all users
app.get('/users', (request, response) => {
  runQuery(`SELECT * FROM Users`, [], (err, users) => {
    if (err) {
      return response.status(500).json({ message: 'Error fetching users' });
    }
    response.json(users);
  });
});


// 6. Get all posts
app.get('/posts', (request, response) => {
  runQuery(`SELECT * FROM posts`, [], (err, posts) => {
    if (err) {
      return response.status(500).json({ message: 'Error fetching posts' });
    }
    response.json(posts);
  });
});