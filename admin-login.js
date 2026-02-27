// --- EDIT YOUR CREDENTIALS HERE ---
const ADMIN_EMAIL = "email@school.edu";
const ADMIN_PASSWORD = "admin123"; 
// ----------------------------------

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const emailInput = document.getElementById('email').value;
    const passInput = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');

    // Check if input matches the hardcoded values above
    if (emailInput === ADMIN_EMAIL && passInput === ADMIN_PASSWORD) {
        // Set a simple login flag
        localStorage.setItem('isAdminLoggedIn', 'true');
        
        // Change 'admin-panel.html' to whatever your admin page is named
        window.location.href = 'admin.html'; 
    } else {
        // Show error message and clear password
        errorMsg.style.display = 'block';
        document.getElementById('password').value = '';
        
        // Shake effect (optional) to show error
        const container = document.querySelector('.container');
        container.style.animation = 'none';
        container.offsetHeight; /* trigger reflow */
        container.style.animation = 'shake 0.3s';
    }
});