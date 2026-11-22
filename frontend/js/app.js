// ============================================================
// APPLICATION INITIALIZATION
// ============================================================
import { loadPage } from "./router.js";
import { getCurrentEmployee, logout } from "./api/authApi.js";
import { loadLoginPage } from "./pages/loginPage.js";
import { setAuthState, clearAuthState, getAvailableWorkspaces } from "../auth/authState.js";

// ============================================================
// SIGN OUT CONFIRMATION
// ============================================================

function initializeSignOut() {
    const dialog = document.getElementById("sign-out-dialog");
    const cancelButton = document.getElementById("cancel-sign-out");
    const confirmButton = document.getElementById("confirm-sign-out");
    const errorMessage = document.getElementById("sign-out-error");

    cancelButton.addEventListener("click", () => {
        dialog.close();
    });

    confirmButton.addEventListener("click", async () => {
        confirmButton.disabled = true;
        confirmButton.textContent = "Signing Out...";
        errorMessage.hidden = true;
        errorMessage.textContent = "";

        try {
            await logout();
            clearAuthState();
            window.location.reload();
        } catch (error) {
            errorMessage.textContent =
                error.message || "Unable to sign out.";
            errorMessage.hidden = false;

            confirmButton.disabled = false;
            confirmButton.textContent = "Sign Out";
        }
    });

    return () => {
        errorMessage.hidden = true;
        errorMessage.textContent = "";
        dialog.showModal();
    };
}

// ============================================================
// INITIALIZE NAVIGATION
// ============================================================
function initializeNavigation() {
    const menuToggle = document.getElementById("menu-toggle");
    menuToggle.hidden = false;
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const workspaceSelect = document.getElementById("workspace-select");
    const workspaceControl =
        document.querySelector(".workspace-control");
    // --------------------------------------------------
    // Add an event listener to toggle the hamburger menu
    // --------------------------------------------------
    menuToggle.addEventListener("click", () => {
        hamburgerMenu.classList.toggle("active");

        const isOpen = hamburgerMenu.classList.contains("active");

        menuToggle.setAttribute("aria-expanded", isOpen);
    });

    // ---------------------------
    // Hamburger Menu 
    // ---------------------------
    const showSignOutConfirmation = initializeSignOut();
    hamburgerMenu.addEventListener("click", (event) => {

        const signOutButton = event.target.closest(
            '[data-action="sign-out"]'
        );

        if (signOutButton) {
            hamburgerMenu.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");

            showSignOutConfirmation();
            return;
        }

        const menuLink = event.target.closest("[data-page]");

        if (!menuLink) {
            console.log("No Menu link available.");
            return;
        }

        const page = menuLink.dataset.page;
        loadPage(page);

        hamburgerMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    });

    // ---------------------------
    // Workspace Selection
    // ---------------------------

    const workspaceHomePages = {
        processing: "processing-home",
        authorized_staff: "authorized-home",
        employee: "employee-home",
        manager: "manager-home"
    };

    const workspaceLabels = {
        processing: "HR Processing Workspace",
        authorized_staff: "Authorized Staff Workspace",
        employee: "Employee Workspace",
        manager: "Manager Workspace"
    };

    // Retrieve workspaces authorized by the backend
    const availableWorkspaces = getAvailableWorkspaces();

    // Clear existing workspace options 
    workspaceSelect.replaceChildren();

    // Populate selector using available workspaces 
    availableWorkspaces.forEach(workspace => {

        const option = document.createElement("option");
        option.value = workspace;
        option.textContent =
            workspaceLabels[workspace] || workspace;
        workspaceSelect.appendChild(option);
    });

    // Set the default workspace
    // everyone has access to the Employee workspace. 
    const defaultWorkspace =
        availableWorkspaces.includes("employee")
            ? "employee"
            : availableWorkspaces[0];

    if (defaultWorkspace) {
        workspaceSelect.value = defaultWorkspace;
    }

    // Display workspace selector after authentication 
    workspaceControl.hidden = false;

    workspaceSelect.addEventListener("change", () => {
        const selectedWorkspace = workspaceSelect.value;
        const homePage = workspaceHomePages[selectedWorkspace];

        if (!homePage) {
            return;
        }

        loadPage(homePage);

        // Close the hamburger menu when switching workspaces.
        hamburgerMenu.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    });
}

async function initializeApp() {
    try {
        // Check for an existing authenticated session 
        const authData = await getCurrentEmployee();
        console.log("Authenticated employee: ", authData);
        // Store employee and workspace information 
        setAuthState(authData);

        // Initialize application navigation 
        initializeNavigation();

        //Load initial workspace 
        loadPage("employee-home");
    } catch (error) {

        clearAuthState();

        if (error.status === 401) {
            // If no Authenticated session exists. 
            // Load the login page. 
            loadLoginPage();

        } else {
            console.error(
                "Unable to initialize application:",
                error
            );
        }
    }
}

initializeApp();

