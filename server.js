const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'tanzu_db'
});



app.post('/signup', (req, res) => {
  const { username, email, password } = req.body;
  db.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password],
    (err) => {
      if (err) {
        res.status(400).json({ error: 'Username/Email already exists!' });
      } else {
        res.json({ success: 'Signup successful!' });
      }
    }
  );
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err || results.length === 0) {
        res.status(400).json({ error: 'Invalid credentials!' });
      } else {
        res.json({ success: 'Login successful!' });
      }
    }
  );
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});