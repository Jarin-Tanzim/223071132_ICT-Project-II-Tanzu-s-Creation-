document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Get all static product IDs
        const staticProductIds = Array.from(document.querySelectorAll('.product-card .add-to-cart'))
            .map(btn => btn.dataset.id);

        // 2. Fetch products from backend
        const response = await fetch('http://localhost:3000/admin/products');
        const products = await response.json();

        // 3. Filter only new products (not already in static HTML)
        const newProducts = products.filter(prod => !staticProductIds.includes(prod.id.toString()));

        // 4. Add new product cards
        const productsList = document.getElementById('productsList');
        newProducts.forEach(product => {
            const imageUrl = product.image_url ? product.image_url : 'https://via.placeholder.com/180';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price">${product.price}</div>
                    <button class="add-to-cart"
                        data-id="${product.id}"
                        data-name="${product.name}"
                        data-price="${product.price}"
                        data-image="${product.image_url}">
                        Add to Cart
                    </button>
                </div>
            `;
            productsList.appendChild(card);
        });

        // 5. Attach Add to Cart handlers for ALL (static + dynamic)
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const name = this.dataset.name;
                const price = this.dataset.price;
                const image = this.dataset.image;
                // Call your cart function here if you have one!
                alert(`Added "${name}" to cart!`);
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
});
