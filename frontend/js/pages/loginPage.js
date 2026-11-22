// Login Page for all users
import { login } from "../api/authApi.js";
// ============================

export function loadLoginPage() {
    const contentArea =
        document.getElementById("contentArea");

    // Configure the header for unauthenticated users
    document.getElementById("page-title").textContent = "All Things HR";
    document.getElementById("menu-toggle").hidden = true;
    document.querySelector(".workspace-control").hidden = true;

    const loginPage = document.createElement("div");
    loginPage.classList.add("login-container");

    loginPage.innerHTML = `
        <div class="login-card">
            <div class="login-introduction">
                <h1>Welcome to All Things HR</h1>
                <p>Your Human Resources Management System</p>
            </div>

            <div class="login-form-section">
                <h2>Sign In</h2>
                <p>
                    Enter your credentials to access your
                    authorized workspaces.
                </p>

                <form id="login-form">
                    <div class="form-group">
                        <label for="login-email">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="login-email"
                            name="email"
                            autocomplete="username"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="login-password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="login-password"
                            name="password"
                            autocomplete="current-password"
                            required
                        >
                    </div>

                    <div id="login-error" role="alert"></div>

                    <button type="submit" id="login-button">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    `;

    contentArea.replaceChildren(loginPage);

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