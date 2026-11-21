// Login Page for all users
import { login } from "../api/authApi.js"; 
// ============================
export function loadLoginPage() { 
    const contentArea =
        document.getElementById("contentArea"); 

    const loginPage = document.createElement("div"); 
    loginPage.classList.add("login-container"); 

    loginPage.innerHTML = ` 
        <div class="login-card">
            <h2>Employee Login</h2>
            <p> Sign in to access the HR request system. </p>

            <form id="login-form">
                <div class="form-group">
                    <label for="login-email">Email</label>
                    <input type="email" id="login-email" name="email" autocomplete="username" required>
                </div>
            <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" name="password" autocomplete="current-password" required> 
            </div>
            <div id="login-error"></div>

            <button type="submit" id="login-button">Sign In</button>
        </div>
    `; 
    contentArea.replaceChildren(loginPage); 

    // Attaching the login event listener
    const loginForm =
        loginPage.querySelector("#login-form"); 
    loginForm.addEventListener("submit", handleLogin); 
}
// ============================================
// HANDLE LOGIN
// ============================================
async function handleLogin(event) { 
    event.preventDefault(); 

    const loginForm = event.currentTarget; 
    const email =
        loginForm.elements.email.value.trim(); 
    const password =
        loginForm.elements.password.value; 

    const loginButton =
        loginForm.querySelector("#login-button"); 

    const errorMessage =
        loginForm.querySelector("#login-error"); 

    try { 
        loginButton.disabled = true; 
        loginButton.textContent = "Signing in..."; 

        errorMessage.textContent = ""; 

        // Authenticate employee 
        await login(email, password); 

        // Retart application to initialize authenticated session 
        window.location.reload(); 
    } catch (error) { 
        console.error("Login failed:", error); 

        errorMessage.textContent =
            error.message || "Unable to sign in."; 

        loginButton.disabled = false; 
        loginButton.textContent = "Sign In"; 
    }
}