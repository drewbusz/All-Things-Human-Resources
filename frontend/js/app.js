// -------------------
// Global State
// ----------------

// Import the page router
import { loadPage } from "./router.js";

const menuToggle = document.getElementById("menu-toggle");
const hamburgerMenu = document.getElementById("hamburger-menu");

// add an event listener to toggle the hamburger menu
menuToggle.addEventListener("click", () => {
    hamburgerMenu.classList.toggle("active");

    const isOpen = hamburgerMenu.classList.contains("active");

    menuToggle.setAttribute("aria-expanded", isOpen);
});

// ---------------------------
// Hamburger Menu 
// ---------------------------
hamburgerMenu.addEventListener("click", (event) => { 
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


// ------------------
// Initial Page
// ------------------
loadPage("process-request", 1, 2); 