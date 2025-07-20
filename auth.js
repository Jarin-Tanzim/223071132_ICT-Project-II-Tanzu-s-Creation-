document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

   
    const userInput = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: userInput, 
                password: password
            })
        });

        const result = await response.json();

        if (result.success) {
           
            if (result.token) {
                localStorage.setItem("token", result.token);
            }
            localStorage.setItem("user", JSON.stringify(result.user));

            if (result.user.role === 'admin') {
                window.location.href = "admin.html";
            } else {
                window.location.href = "homepage.html";
            }
        } else {
            alert(result.error || "Login failed. Please try again.");
        }
    } catch (error) {
        alert("Network error. Please check your connection.");
    }
});
