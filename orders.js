console.log("Orders.js script loaded");

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  console.log("User from localStorage:", user);

  if (!token || !user) {
    alert('Please login to view your orders');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/orders/me?userId=${user.id}`);
    console.log("Fetch response status:", response.status);

    const rawText = await response.text();
    console.log("Raw response text:", rawText);

    let orders;
    try {
      orders = JSON.parse(rawText);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      throw new Error("Invalid JSON response from server");
    }

    console.log("Parsed orders:", orders);

    const ordersList = document.getElementById('ordersList');

    if (!Array.isArray(orders) || orders.length === 0) {
      ordersList.innerHTML = `
        <div class="order-card">
          <p>You haven't placed any orders yet.</p>
          <a href="products.html" class="btn">Browse Products</a>
        </div>
      `;
      return;
    }

    ordersList.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <strong>Order #${order.order_number}</strong>
            <span>Placed on ${new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div>
            <span class="order-status status-${order.status}">${order.status}</span>
          </div>
        </div>

        <div class="order-items">
          ${(Array.isArray(order.items) ? order.items : []).map(item => `
            <div class="order-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #eee;">
              <img src="${item.image || 'https://via.placeholder.com/40'}" alt="${item.name}" width="80" height="80" style="border-radius: 5px; object-fit: cover;">
              <div style="flex-grow: 1;">
                <span>${item.name} × ${item.quantity}</span>
              </div>
              <span>৳${(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>

        <div class="order-total">
          <div style="text-align: right;">
            <p>Subtotal: ৳${Number(order.total_amount).toFixed(2)}</p>
            <p>Shipping: ৳${Number(order.shipping_amount).toFixed(2)}</p>
            <p><strong>Total: ৳${(Number(order.total_amount) + Number(order.shipping_amount)).toFixed(2)}</strong></p>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('🔥 FINAL ERROR:', error);
    const ordersList = document.getElementById('ordersList');
    if (ordersList) {
      ordersList.innerHTML = `
        <div class="order-card">
          <p>Error loading your orders. Please try again later.</p>
        </div>
      `;
    }
  }
});
