document.addEventListener('DOMContentLoaded', () => {
    ensureCartExists();
    updateCartCount();

    // Initialize product page functionality if we're on a product page
    if (document.querySelector('.product-card')) {
        initQuantityControls();
        setupAddToCart();
    }

    // Initialize cart page functionality if we're on the cart page
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

// Quantity handling with event delegation
function initQuantityControls() {
    // Remove any existing listener first
    document.removeEventListener('click', handleQuantityClick);
    
    // Add single delegated listener
    document.addEventListener('click', handleQuantityClick);
}

function handleQuantityClick(e) {
    if (!e.target.classList.contains('quantity-btn')) return;
    
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

// Add to cart functionality with event delegation
function setupAddToCart() {
    // Remove any existing listener first
    document.removeEventListener('click', handleAddToCart);
    
    // Add single delegated listener
    document.addEventListener('click', handleAddToCart);
}

function handleAddToCart(e) {
    if (!e.target.classList.contains('add-to-cart')) return;
    
    const button = e.target;
    const productCard = button.closest('.product-card');
    
    // Get the CURRENT displayed quantity
    const quantity = parseInt(productCard.querySelector('.quantity').textContent);
    
    const product = {
        id: parseInt(button.dataset.id, 10),
        name: button.dataset.name,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image,
        quantity: quantity
    };

    addToCart(product, { mode: 'replace' });
    showAddedFeedback(button);
    
    // Reset quantity to 1 after adding
    productCard.querySelector('.quantity').textContent = '1';
    updateCartCount();
}

function addToCart(product, { mode = 'replace' } = {}) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        if (mode === 'replace') {
            existingItem.quantity = product.quantity;
        } else {
            existingItem.quantity += product.quantity;
        }
    } else {
        cart.push(product);
    }

    saveCart(cart);
}

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
            <div class="cart-empty" style="text-align: center; padding: 50px 20px; color: #666;">
                <i class="fas fa-shopping-cart" style="font-size: 4em; margin-bottom: 20px; opacity: 0.5;"></i>
                <h2 style="margin-bottom: 15px; color: #333;">Your cart is empty</h2>
                <p style="margin-bottom: 30px; font-size: 1.1em;">Looks like you haven't added any items yet</p>
                <a href="products.html" class="btn btn-primary" style="display: inline-block; padding: 12px 30px; background: #2c5530; color: white; text-decoration: none; border-radius: 5px; transition: background 0.3s;">Browse Products</a>
            </div>
        `;
        if (summary) summary.style.display = 'none';
        return;
    }

    if (summary) summary.style.display = 'block';
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}" style="display: flex; align-items: center; padding: 20px; border: 1px solid #ddd; margin-bottom: 15px; border-radius: 8px; background: white;">
            <div class="item-image" style="flex-shrink: 0; margin-right: 20px;">
                <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
            </div>
            <div class="item-details" style="flex: 1;">
                <h3 style="margin: 0 0 10px 0; color: #333; font-size: 1.2em;">${item.name}</h3>
                <p class="item-price" style="margin: 0 0 10px 0; font-size: 1.1em; font-weight: bold; color: #2c5530;">$${item.price.toFixed(2)}</p>
                <div class="item-quantity" style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <button class="quantity-btn minus" style="background: #f0f0f0; border: 1px solid #ddd; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">-</button>
                    <span class="quantity" style="min-width: 30px; text-align: center; font-weight: bold; font-size: 1.1em;">${item.quantity}</span>
                    <button class="quantity-btn plus" style="background: #f0f0f0; border: 1px solid #ddd; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">+</button>
                </div>
                <p class="item-total" style="margin: 0; font-weight: bold; color: #333;">Total: $${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button class="remove-item" style="background: #e74c3c; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 15px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    updateSummary();
}

function updateSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 50; // Flat rate shipping
    const total = subtotal + shipping;

    // Update the summary values in your HTML structure
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function setupCartButtons() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;

    cartItems.addEventListener('click', (e) => {
        const cart = getCart();
        const itemDiv = e.target.closest('.cart-item');
        if (!itemDiv) return;
        
        const itemId = parseInt(itemDiv.dataset.id, 10);
        const item = cart.find(p => p.id === itemId);
        if (!item) return;

        if (e.target.classList.contains('plus')) {
            item.quantity += 1;
        } else if (e.target.classList.contains('minus')) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                // Remove item if quantity would go to 0
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

    checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const cart = getCart();
        
        // Check if cart is empty
        if (cart.length === 0) {
            showNotification('Your cart is empty! Add some products first.', 'warning');
            return;
        }

        // Check if user is logged in
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;

        if (!isLoggedIn) {
            // Show styled modal instead of basic confirm
            showLoginModal();
        } else {
            // User is logged in, proceed to checkout
            window.location.href = 'checkout.html';
        }
    });
}

function showLoginModal() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.login-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'login-modal';
    modal.innerHTML = `
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div style="color: #8864fc; margin-bottom: 20px;">
                    <i class="fas fa-lock" style="font-size: 3em;"></i>
                </div>
                <h2 style="margin-bottom: 15px; color: #333;">Login Required</h2>
                <p style="margin-bottom: 25px; color: #666; line-height: 1.5;">You need to be logged in to proceed to checkout. Would you like to log in now?</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="modal-cancel" style="padding: 12px 25px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 5px; cursor: pointer;">Cancel</button>
                    <button class="modal-login" style="padding: 12px 25px; background: #8864fc; color: white; border: none; border-radius: 5px; cursor: pointer;">Go to Login</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('.modal-cancel').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('.modal-login').addEventListener('click', () => {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
    });

    modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            modal.remove();
        }
    });
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const colors = {
        info: '#3498db',
        success: '#27ae60', 
        warning: '#f39c12',
        error: '#e74c3c'
    };

    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: ${colors[type] || colors.info};
        ">
            <span>${message}</span>
            <button onclick="this.closest('.notification').remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
            ">&times;</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}
