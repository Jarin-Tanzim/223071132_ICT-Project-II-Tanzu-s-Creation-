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
        } else {
            // Show login link if not logged in
            authLink.innerHTML = `<a href="login.html">Login</a>`;
        }
    }
});
