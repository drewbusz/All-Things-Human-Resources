// -------------------
// Global State
// ----------------

// Import the page router
import { loadPage } from "./router.js";

const menuToggle = document.getElementById("menu-toggle");
const hamburgerMenu = document.getElementById("hamburger-menu");
const menuLinks = document.querySelectorAll(".menu-link");

// add an event listener to toggle the hamburger menu
menuToggle.addEventListener("click", () => {
    hamburgerMenu.classList.toggle("active");

    const isOpen = hamburgerMenu.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", isOpen);
});

// ---------------------------
// Navigation
// ---------------------------

menuLinks.forEach(button => {
    button.addEventListener("click", () => {
        const page = button.dataset.page;
        loadPage(page);

        menuToggle.setAttribute("aria-expanded", "false");
    });
});

// ------------------
// Initial Page
// ------------------
loadPage("process-request", 1, 2); 