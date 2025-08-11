document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize quantity controls for static products
        initQuantityControls();
        
        // Fetch and display dynamic products
        await loadDynamicProducts();
        
        // Initialize cart functionality
        setupAddToCart();
        
        // Update cart count display
        updateCartCount();

    } catch (error) {
        console.error('Error initializing products:', error);
        showErrorNotification();
    }
});

// Initialize quantity controls for all product cards
function initQuantityControls() {
    document.querySelectorAll('.product-card').forEach(card => {
        const minusBtn = card.querySelector('.minus');
        const plusBtn = card.querySelector('.plus');
        const quantityDisplay = card.querySelector('.quantity');
        
        // Set initial quantity
        let quantity = 1;
        quantityDisplay.textContent = quantity;

        // Minus button click handler
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                quantityDisplay.textContent = quantity;
            }
        });

        // Plus button click handler
        plusBtn.addEventListener('click', () => {
            quantity++;
            quantityDisplay.textContent = quantity;
        });
    });
}

// Load dynamic products from backend
async function loadDynamicProducts() {
    try {
        // Get IDs of static products
        const staticProductIds = Array.from(document.querySelectorAll('.product-card .add-to-cart'))
            .map(btn => parseInt(btn.dataset.id, 10));

        // Fetch products from backend
        const response = await fetch('http://localhost:3000/admin/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const products = await response.json();
        const newProducts = products.filter(prod => !staticProductIds.includes(prod.id));

        // Add new products to the page
        if (newProducts.length > 0) {
            addProductsToPage(newProducts);
        }
    } catch (error) {
        console.error('Error loading dynamic products:', error);
        throw error;
    }
}

// Add products to the page
function addProductsToPage(products) {
    const productsList = document.getElementById('productsList');
    
    products.forEach(product => {
        const imageUrl = product.image_url || 'https://via.placeholder.com/180';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price">$${product.price.toFixed(2)}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn minus">-</button>
                    <span class="quantity">1</span>
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="add-to-cart"
                    data-id="${product.id}"
                    data-name="${product.name}"
                    data-price="${product.price}"
                    data-image="${imageUrl}">
                    Add to Cart
                </button>
            </div>
        `;
        
        productsList.appendChild(card);
        
        // Initialize quantity controls for the new product
        initQuantityControlsForCard(card);
    });
}

// Initialize quantity controls for a single product card
function initQuantityControlsForCard(card) {
    const minusBtn = card.querySelector('.minus');
    const plusBtn = card.querySelector('.plus');
    const quantityDisplay = card.querySelector('.quantity');
    
    let quantity = 1;
    quantityDisplay.textContent = quantity;

    minusBtn.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            quantityDisplay.textContent = quantity;
        }
    });

    plusBtn.addEventListener('click', () => {
        quantity++;
        quantityDisplay.textContent = quantity;
    });
}

// Setup add to cart functionality
function setupAddToCart() {
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-to-cart')) {
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
    });
}

// Add item to cart
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Show feedback when item is added to cart
function showAddedFeedback(button) {
    const originalText = button.textContent;
    button.textContent = "✓ Added!";
    button.classList.add('added-to-cart');
    
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('added-to-cart');
    }, 2000);
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems > 0 ? `(${totalItems})` : '';
    });
}

// Show error notification
function showErrorNotification() {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <p>There was an error loading products. Please try again later.</p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
