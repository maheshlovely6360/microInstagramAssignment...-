const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

// Initialize express app
const app = express();
app.use(bodyParser.json());

// Database configuration
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

// Initialize database tables
function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(256) NOT NULL,
      mobile_number TEXT UNIQUE NOT NULL,
      address TEXT,
      post_count INTEGER DEFAULT 0,
      password TEXT NOT NULL
    )
  `);

  // Posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      user_id INTEGER,
      images TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE CASCADE
    )
  `);
}

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};

// Authentication Routes
app.post('/api/register', async (req, res) => {
  const { name, mobile_number, address, password } = req.body;

  // Validate required fields
  if (!name || !mobile_number || !password) {
    return res.status(400).json({ error: 'Name, mobile number, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (name, mobile_number, address, password) VALUES (?, ?, ?, ?)',
      [name, mobile_number, address, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Mobile number already registered' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }
        res.status(201).json({ 
          id: this.lastID, 
          name, 
          mobile_number, 
          address,
          post_count: 0
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/api/login', (req, res) => {
  const { mobile_number, password } = req.body;

  // Validate required fields
  if (!mobile_number || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE mobile_number = ?',
    [mobile_number],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Error during login' });
      }
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      const token = jwt.sign(
        { id: user.id, mobile_number: user.mobile_number },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );

      res.json({ 
        token,
        user: {
          id: user.id,
          name: user.name,
          mobile_number: user.mobile_number,
          address: user.address,
          post_count: user.post_count
        }
      });
    }
  );
});

// User Routes
app.get('/api/users', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, name, mobile_number, address, post_count FROM users',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching users' });
      }
      res.json(rows);
    }
  );
});

// Post Routes
// Create a post
app.post('/api/posts', authenticateToken, (req, res) => {
  const { title, description, images } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!title || !images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Title and images array are required' });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO posts (title, description, user_id, images) VALUES (?, ?, ?, ?)',
      [title, description, userId, JSON.stringify(images)],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Error creating post' });
        }

        const postId = this.lastID;

        db.run(
          'UPDATE users SET post_count = post_count + 1 WHERE id = ?',
          [userId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Error updating post count' });
            }

            db.run('COMMIT');
            res.status(201).json({
              id: postId,
              title,
              description,
              user_id: userId,
              images
            });
          }
        );
      }
    );
  });
});

// Get all posts
app.get('/api/posts', authenticateToken, (req, res) => {
  db.all(
    `SELECT posts.*, users.name as user_name 
     FROM posts 
     JOIN users ON posts.user_id = users.id
     ORDER BY posts.id DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching posts' });
      }
      
      const posts = rows.map(post => ({
        ...post,
        images: JSON.parse(post.images)
      }));
      
      res.json(posts);
    }
  );
});

// Get posts by user
app.get('/api/users/:userId/posts', authenticateToken, (req, res) => {
  const { userId } = req.params;

  db.all(
    'SELECT * FROM posts WHERE user_id = ? ORDER BY id DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching user posts' });
      }

      const posts = rows.map(post => ({
        ...post,
        images: JSON.parse(post.images)
      }));

      res.json(posts);
    }
  );
});

// Update a post
app.put('/api/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, images } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!title || !images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Title and images array are required' });
  }

  db.run(
    `UPDATE posts 
     SET title = ?, description = ?, images = ?
     WHERE id = ? AND user_id = ?`,
    [title, description, JSON.stringify(images), id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating post' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }
      res.json({ message: 'Post updated successfully' });
    }
  );
});

// Delete a post
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [id, userId],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Error deleting post' });
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        db.run(
          'UPDATE users SET post_count = post_count - 1 WHERE id = ?',
          [userId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Error updating post count' });
            }

            db.run('COMMIT');
            res.json({ message: 'Post deleted successfully' });
          }
        );
      }
    );
  });
});

// Apply error handling middleware
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
