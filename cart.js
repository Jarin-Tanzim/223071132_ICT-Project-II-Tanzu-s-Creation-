// BEFORE
document.addEventListener('DOMContentLoaded', () => {
  ensureCartExists();
  initQuantityControls();
  setupAddToCart();
  updateCartCount();

  if (onCartPage()) {
    displayCart();
    setupCartButtons();
    setupCheckoutButton();
  }
});

// AFTER
document.addEventListener('DOMContentLoaded', () => {
  ensureCartExists();
  updateCartCount();

  if (onCartPage()) {
    displayCart();
    setupCartButtons();
    setupCheckoutButton();
  }
});

// Core cart functions
function ensureCartExists() {
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function onCartPage() {
    return document.querySelector('.cart-container') !== null;
}

// Quantity handling
function initQuantityControls() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const controls = e.target.closest('.quantity-controls');
            if (!controls) return;
            
            const quantityElement = controls.querySelector('.quantity');
            let quantity = parseInt(quantityElement.textContent);
            
            if (e.target.classList.contains('plus')) {
                quantity++;
            } else if (e.target.classList.contains('minus') && quantity > 1) {
                quantity--;
            }
            
            quantityElement.textContent = quantity;
        }
    });
}

// Add to cart functionality - FIXED VERSION
function setupAddToCart() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const button = e.target;
            const productCard = button.closest('.product-card');
            
            // Get the CURRENT displayed quantity (not incrementing)
            const quantity = parseInt(productCard.querySelector('.quantity').textContent);
            
            const product = {
                id: parseInt(button.dataset.id, 10),
                name: button.dataset.name,
                price: parseFloat(button.dataset.price),
                image: button.dataset.image,
                quantity: quantity // Use the exact displayed quantity
            };

            addToCart(product, { mode: 'replace' });

            showAddedFeedback(button);
            
            // Reset quantity to 1 after adding
            productCard.querySelector('.quantity').textContent = '1';
            updateCartCount();
        }
    });
}

function addToCart(product, { mode = 'replace' } = {}) {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    if (mode === 'replace') {
      existingItem.quantity = product.quantity; // make cart match picker
    } else {
      existingItem.quantity += product.quantity; // old behavior
    }
  } else {
    cart.push(product);
  }

  saveCart(cart);
}


// ... rest of the functions remain the same as previous version ...

function showAddedFeedback(button) {
    const originalText = button.textContent;
    button.textContent = "✓ Added!";
    button.classList.add('added-to-cart');
    
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('added-to-cart');
    }, 2000);
}

// ======================
// CART PAGE FUNCTIONS
// ======================

function displayCart() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    const summary = document.querySelector('.cart-summary');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added any items yet</p>
                <a href="products.html" class="btn btn-primary">Browse Products</a>
            </div>
        `;
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';
    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="item-price">$${item.price.toFixed(2)}</p>
                <div class="item-quantity">
                    <button class="quantity-btn minus">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus">+</button>
                </div>
                <p class="item-total">Total: $${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button class="remove-item"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    updateSummary();
}

function updateSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 50; // Flat rate shipping
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shipping.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function setupCartButtons() {
    document.getElementById('cartItems').addEventListener('click', (e) => {
        const cart = getCart();
        const itemDiv = e.target.closest('.cart-item');
        const itemId = parseInt(itemDiv?.dataset.id, 10);
        const item = cart.find(p => p.id === itemId);

        if (!item) return;

        if (e.target.classList.contains('plus')) {
            item.quantity += 1;
        } else if (e.target.classList.contains('minus')) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                const index = cart.indexOf(item);
                cart.splice(index, 1);
            }
        } else if (e.target.closest('.remove-item')) {
            const index = cart.indexOf(item);
            cart.splice(index, 1);
        }

        saveCart(cart);
        displayCart();
        updateCartCount();
    });
}

// ======================
// CART COUNT & CHECKOUT
// ======================

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems > 0 ? `(${totalItems})` : '';
    });
}

function setupCheckoutButton() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', () => {
        const isLoggedIn = !!localStorage.getItem('token');
        const cart = getCart();

        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (!isLoggedIn) {
            alert('Please log in to proceed to checkout');
            window.location.href = 'login.html';
        } else {
            window.location.href = 'checkout.html';
        }
    });
}
