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

//  login endpoint 
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?',
    [username, username, password],
    (err, results) => {
      if (err || results.length === 0) {
        res.status(400).json({ error: 'Invalid credentials!' });
      } else {
        const user = results[0];
        res.json({
          success: true,
          token: 'logged-in',
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      }
    }
  );
});

// ------------------ SIGN UP ENDPOINT (UPDATED) -------------------
app.post('/signup', (req, res) => {
  const { username, email, password, security_question, security_answer } = req.body;
  db.query(
    'INSERT INTO users (username, email, password, security_question, security_answer) VALUES (?, ?, ?, ?, ?)',
    [username, email, password, security_question, security_answer],
    (err, result) => {
      if (err) {
        return res.status(400).json({ error: "Signup failed", details: err.sqlMessage });
      }
      res.json({ success: true });
    }
  );
});

// ------------------- FORGOT PASSWORD: FETCH SECURITY QUESTION ---------------
app.post('/forgot-password-question', (req, res) => {
  const { usernameOrEmail } = req.body;
  db.query(
    'SELECT username, security_question FROM users WHERE username = ? OR email = ?',
    [usernameOrEmail, usernameOrEmail],
    (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false, error: "User not found" });
      }
      res.json({
        success: true,
        username: results[0].username,
        security_question: results[0].security_question
      });
    }
  );
});

// ------------------- FORGOT PASSWORD: VERIFY SECURITY ANSWER ---------------
app.post('/verify-security-answer', (req, res) => {
  const { username, security_answer } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? AND security_answer = ?',
    [username, security_answer],
    (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false, error: "Incorrect security answer." });
      }
      res.json({ success: true });
    }
  );
});

// ------------------- FORGOT PASSWORD: RESET PASSWORD ---------------
app.post('/reset-password', (req, res) => {
  console.log("RESET REQUEST", req.body);
  const { username, security_answer, new_password } = req.body;
  db.query(
    'SELECT * FROM users WHERE username = ? AND security_answer = ?',
    [username, security_answer],
    (err, results) => {
      if (err || results.length === 0) {
        return res.json({ success: false, error: "Incorrect security answer." });
      }
      db.query(
        'UPDATE users SET password = ? WHERE username = ?',
        [new_password, username],
        (err2, result) => {
          if (err2) return res.json({ success: false, error: "Could not reset password." });
          res.json({ success: true });
        }
      );
    }
  );
});

app.post('/orders', (req, res) => {
  const { userId, items, totalAmount, shippingAmount, paymentMethod, customerInfo } = req.body;

  console.log('--- RECEIVED ORDER ---');
  console.log('BODY:', req.body);

  if (!userId) {
    console.log('ERROR: userId missing');
    return res.status(400).json({ error: "You must be logged in to place an order." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    console.log('ERROR: No items in cart');
    return res.status(400).json({ error: "No items in cart." });
  }

  db.beginTransaction(err => {
    if (err) {
      console.log('ERROR: Transaction failed to start', err);
      return res.status(500).json({ error: 'Transaction failed to start' });
    }

    // 1. Create order record
    const orderQuery = `
      INSERT INTO orders (
        user_id, order_number, total_amount, shipping_amount, 
        payment_method, status, customer_name, customer_email, 
        customer_phone, shipping_address
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `;
    const orderNumber = 'TZ-' + Date.now();
    const orderValues = [
      userId,
      orderNumber,
      totalAmount,
      shippingAmount,
      paymentMethod,
      customerInfo.name,
      customerInfo.email,
      customerInfo.phone,
      customerInfo.address
    ];

    db.query(orderQuery, orderValues, (err, orderResult) => {
      if (err) {
        console.log('Order insert error:', err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Order creation failed', details: err.sqlMessage });
        });
      }

      const orderId = orderResult.insertId;
      console.log('Order created. ID:', orderId);

      // 2. Insert order items
      const itemsQuery = `
        INSERT INTO order_items (
          order_id, product_id, quantity, unit_price
        ) VALUES ?
      `;
      const itemsValues = items.map(item => [
        orderId,
        parseInt(item.id, 10),   // Ensure this is an integer
        parseInt(item.quantity, 10),
        parseFloat(item.price)
      ]);
      console.log('itemsValues:', itemsValues);

      db.query(itemsQuery, [itemsValues], (err) => {
        if (err) {
          console.log('Order items insert error:', err);
          return db.rollback(() => {
            res.status(500).json({ error: 'Order items failed', details: err.sqlMessage });
          });
        }

        db.commit(err => {
          if (err) {
            console.log('Transaction commit error:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Transaction commit failed', details: err.sqlMessage });
            });
          }

          res.json({
            success: true,
            orderId: orderId,
            orderNumber: orderNumber
          });
        });
      });
    });
  });
});

// ------------------ ADMIN ENDPOINTS ------------------
app.get('/admin/orders', (req, res) => {
  db.query(`
    SELECT o.*, u.username 
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/admin/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/admin/stats', (req, res) => {
  db.query(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
      (SELECT COUNT(*) FROM products) as total_products
    FROM orders
  `, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(results[0]);
    }
  });
});

// ----- NEW: Admin Best Sellers -----
app.get('/admin/best-sellers', (req, res) => {
  const query = `
    SELECT p.name, SUM(oi.quantity) AS total_sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// ----- NEW: Admin Customers List -----
app.get('/admin/customers', (req, res) => {
  db.query(
    "SELECT id, username, email FROM users WHERE role = 'customer'",
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(results);
    }
  );
});

// ADD NEW PRODUCT
app.post('/admin/products', (req, res) => {
  const { name, price, stock, image_url, description } = req.body;
  db.query(
    'INSERT INTO products (name, price, stock, image_url, description) VALUES (?, ?, ?, ?, ?)',
    [name, price, stock, image_url, description],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: 'Could not add product', details: err.sqlMessage });
      } else {
        res.json({ success: true, id: result.insertId });
      }
    }
  );
});
// DELETE a product by id
app.delete('/admin/products/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete failed.' });
    res.json({ success: true });
  });
});

// EDIT (update) a product by id
app.put('/admin/products/:id', (req, res) => {
  const id = req.params.id;
  const { name, price, stock, image_url, description } = req.body;
  db.query(
    'UPDATE products SET name=?, price=?, stock=?, image_url=?, description=? WHERE id=?',
    [name, price, stock, image_url, description, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Update failed.' });
      res.json({ success: true });
    }
  );
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// Save contact message
app.post('/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  db.query(
    'INSERT INTO messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
    [name, email, phone, message],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: 'Message saving failed' });
      res.json({ success: true });
    }
  );
});

// Admin get messages
app.get('/admin/messages', (req, res) => {
  db.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    res.json(results);
  });
});
// Admin updates order status
app.put('/admin/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
});


app.get('/orders/me', (req, res) => {
  const userId = req.query.userId;
  console.log("GET /orders/me hit with userId:", userId);

  if (!userId) {
    console.log("Missing user ID");
    return res.status(400).json({ error: 'Missing user ID' });
  }

  const orderQuery = `
    SELECT 
      id AS order_id,
      order_number,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
      total_amount,
      shipping_amount,
      status
    FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(orderQuery, [userId], (err, orders) => {
    if (err) {
      console.error('Order query error:', err);
      return res.status(500).json({ error: 'Database error fetching orders' });
    }

    if (orders.length === 0) {
      console.log("No orders found for userId:", userId);
      return res.json([]);
    }

    const orderIds = orders.map(o => o.order_id);
    console.log("Found orders:", orderIds);

   
    const itemsQuery = `
      SELECT 
        oi.order_id,
        p.name,
        p.image_url,
        oi.quantity,
        oi.unit_price AS price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id IN (?)
    `;

    db.query(itemsQuery, [orderIds], (err, items) => {
      if (err) {
        console.error('Item query error:', err);
        return res.status(500).json({ error: 'Database error fetching items' });
      }

      const itemsByOrder = {};
      for (const item of items) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        itemsByOrder[item.order_id].push({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image_url || '' 
        });
      }

      const fullOrders = orders.map(order => ({
        ...order,
        items: itemsByOrder[order.order_id] || []
      }));

      console.log("Returning orders:", fullOrders.length);
      res.json(fullOrders);
    });
  });
});
