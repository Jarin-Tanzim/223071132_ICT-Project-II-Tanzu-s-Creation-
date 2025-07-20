document.addEventListener('DOMContentLoaded', () => {
    ensureCartExists();

    if (onCartPage()) {
        displayCart();
        setupCartButtons();
        setupCheckoutButton();
    }

    setupAddToCart();
});

function ensureCartExists() {
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}

function onCartPage() {
    return document.querySelector('.cart-container') !== null;
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function setupAddToCart() {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            // Always use numeric id!
            const product = {
                id: parseInt(button.dataset.id, 10),   // <<<<<<<<<<<< key line
                name: button.dataset.name,
                price: parseFloat(button.dataset.price),
                image: button.dataset.image,
                quantity: 1
            };

            const cart = getCart();
            // Also compare as number:
            const existing = cart.find(item => item.id === product.id);

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push(product);
            }

            saveCart(cart);
            showAddedFeedback(button);
        });
    });
}

function showAddedFeedback(button) {
    const originalText = button.textContent;
    button.textContent = "Added!";
    button.disabled = true;
    button.style.backgroundColor = "#4CAF50";

    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        button.style.backgroundColor = "";
    }, 1500);
}

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
                <p class="item-price">${item.price.toFixed(2)}</p>
                <div class="item-quantity">
                    <button class="quantity-btn minus">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus">+</button>
                </div>
                <p class="item-total">Total: ${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <button class="remove-item"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    updateSummary();
}

function updateSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = 50;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function setupCartButtons() {
    document.getElementById('cartItems').addEventListener('click', (e) => {
        const cart = getCart();
        const itemDiv = e.target.closest('.cart-item');
        const itemId = parseInt(itemDiv?.dataset.id, 10); // always integer
        const item = cart.find(p => p.id === itemId);

        if (!item) return;

        if (e.target.classList.contains('plus')) {
            item.quantity += 1;
        } else if (e.target.classList.contains('minus')) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                const index = cart.indexOf(item);
                if (index !== -1) cart.splice(index, 1);
            }
        } else if (e.target.closest('.remove-item')) {
            const index = cart.indexOf(item);
            if (index !== -1) cart.splice(index, 1);
        }

        saveCart(cart);
        displayCart();
    });
}

function setupCheckoutButton() {
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            const isLoggedIn = !!localStorage.getItem("token");

            if (!isLoggedIn) {
                alert("Please log in before proceeding to checkout.");
                window.location.href = "login.html";
            } else {
                window.location.href = "checkout.html"; 
            }
        });
    }
}
