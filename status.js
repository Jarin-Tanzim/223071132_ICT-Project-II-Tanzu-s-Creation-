document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    const authLink = document.getElementById("authLink");

    if (authLink) {
        if (token && user && user.username) {
           
            authLink.innerHTML = `
                <span style="margin-right: 10px;">Welcome, <b>${user.username}</b></span>
                <a href="#" id="logoutBtn">Logout</a>
            `;
            
           
            document.getElementById("logoutBtn").addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("cart");
                window.location.href = "login.html";
            });

           
            const navMenu = document.querySelector('.main-nav ul');
            
            
            const existingOrdersLink = document.querySelector('a[href="orders.html"]');
            
           
            if (navMenu && !existingOrdersLink) {
              
                const ordersItem = document.createElement('li');
                ordersItem.innerHTML = '<a href="orders.html">My Orders</a>';
                
              
                const authListItem = authLink.closest('li');
                if (authListItem) {
                    navMenu.insertBefore(ordersItem, authListItem);
                } else {
                    navMenu.appendChild(ordersItem);
                }
            }
        } else {
            
            authLink.innerHTML = `<a href="login.html">Login</a>`;
            
            
            const ordersLink = document.querySelector('a[href="orders.html"]');
            if (ordersLink) {
                ordersLink.closest('li').remove();
            }
        }
    }
});
