document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById("username").value,
                password: document.getElementById("password").value
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.location.href = "homepage.html";
        } else {
            alert(result.error || "Login failed. Please try again.");
        }
    } catch (error) {
        alert("Network error. Please check your connection.");
    }
});