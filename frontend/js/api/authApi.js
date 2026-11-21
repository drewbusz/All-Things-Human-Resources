// =====================================================
// AUTHENTICATION API
// =====================================================

async function authRequest(url, options = {}) { 

    const response = await fetch(url, { 
        ...options, 
        credentials: "same-origin", 
        headers: { 
            "Content-Type": "application/json", 
            ...options.headers
        }
    }); 

    const data = await response.json().catch(() => null); 

    if (!response.ok) { 
        const error = new Error(
            data?.message || "Authentication request failed."
        ); 

        error.status = response.status; 
        throw error; 
    }
    return data; 
}

// ========================================
// LOGIN
// ========================================

export async function login(email, password) { 

    return authRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    }); 
}

// ============================================================
// CURRENT EMPLOYEE
// ============================================================

export async function getCurrentEmployee() {

    return authRequest("/api/auth/me", {
        method: "GET"
    });
}

// ============================================================
// LOGOUT
// ============================================================

export async function logout() {

    return authRequest("/api/auth/logout", {
        method: "POST"
    });
}