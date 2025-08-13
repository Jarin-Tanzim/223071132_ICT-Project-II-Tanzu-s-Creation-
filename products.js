document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize static products ONCE
        initQuantityControls();
        setupAddToCart();
        updateCartCount();
        
        // Then try to load admin products
        await loadAdminProducts();
        
    } catch (error) {
        console.error('Error:', error);
        // Even if this fails, static products remain visible
    }
});

async function loadAdminProducts() {
    try {
        const response = await fetch('http://localhost:3000/admin/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const adminProducts = await response.json();
        addAdminProducts(adminProducts);
        
    } catch (error) {
        console.error('Failed to load admin products:', error);
        showErrorNotification('Could not load additional products. Showing standard collection.');
    }
}

function addAdminProducts(adminProducts) {
    const productsContainer = document.getElementById('productsList');
    if (!productsContainer) return;
    
    // Get IDs of existing products
    const existingIds = new Set(
        Array.from(document.querySelectorAll('.product-card .add-to-cart'))
            .map(btn => parseInt(btn.dataset.id))
    );
    
    // Filter and add new products
    adminProducts.forEach(product => {
        if (!existingIds.has(product.id)) {
            const productCard = createProductCard({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price), // Ensure price is a number
                image: product.image_url
            });
            productsContainer.appendChild(productCard);
        }
    });
    
    // DON'T reinitialize - the existing event listeners will handle new elements
    // The event listeners are already set up with event delegation
}

function createProductCard(product) {
    const imageUrl = product.image || 'https://via.placeholder.com/300';
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        <div class="product-info">
            <h3>${product.name}</h3>
            <div class="price">$${price.toFixed(2)}</div>
            <div class="quantity-controls">
                <button class="quantity-btn minus">-</button>
                <span class="quantity">1</span>
                <button class="quantity-btn plus">+</button>
            </div>
            <button class="add-to-cart"
                data-id="${product.id}"
                data-name="${product.name}"
                data-price="${price}"
                data-image="${imageUrl}">
                Add to Cart
            </button>
        </div>
    `;
    return card;
}

// Use event delegation to handle all quantity controls
function initQuantityControls() {
    // Remove any existing listeners first
    document.removeEventListener('click', handleQuantityClick);
    
    // Add single delegated listener
    document.addEventListener('click', handleQuantityClick);
}

function handleQuantityClick(e) {
    if (!e.target.classList.contains('quantity-btn')) return;
    
    const card = e.target.closest('.product-card');
    if (!card) return;
    
    const quantityDisplay = card.querySelector('.quantity');
    let quantity = parseInt(quantityDisplay.textContent);
    
    if (e.target.classList.contains('minus') && quantity > 1) {
        quantity--;
    } else if (e.target.classList.contains('plus')) {
        quantity++;
    }
    
    quantityDisplay.textContent = quantity;
}

function setupAddToCart() {
    // Remove any existing listeners first
    document.removeEventListener('click', handleAddToCart);
    
    // Add single delegated listener
    document.addEventListener('click', handleAddToCart);
}

function handleAddToCart(event) {
    if (!event.target.classList.contains('add-to-cart')) return;
    
    const button = event.target;
    const card = button.closest('.product-card');
    const quantity = parseInt(card.querySelector('.quantity').textContent, 10);
    
    const product = {
        id: parseInt(button.dataset.id, 10),
        name: button.dataset.name,
        price: parseFloat(button.dataset.price),
        image: button.dataset.image,
        quantity: quantity
    };

    addToCart(product);
    showAddedFeedback(button);
    
    // Reset quantity to 1 after adding to cart
    card.querySelector('.quantity').textContent = '1';
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
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

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems > 0 ? `(${totalItems})` : '';
    });
}

function showErrorNotification(message = 'There was an error loading products.') {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
