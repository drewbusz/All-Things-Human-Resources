// ====================================
// Defining navigation and Page titles
// ====================================

const navigation = {
    employee: {
        title: "All Things HR | Employees",
        links: [
            {
                page: "employee-home",
                label: "Employee Portal"
            },
            {
                page: "employee-history",
                label: "Employee History"
            },
            {
                page: "my-requests",
                label: "My Requests"
            },
            {
                page: "submit-request",
                label: "Submit New Request"
            },
        ]
    },
    processing: {
        title: "All Things HR | Processing",

        links: [
            {
                page: "processing-home",
                label: "Processing Home"
            },
            {
                page: "assigned-requests",
                label: "My Assigned Requests"
            },
            {
                page: "new-requests",
                label: "New Requests"
            },
            
        ]
    },
    authorized_staff: {
        title: "All Things HR | Authorized Staff",

        links: [
            {
                page: "authorized-home",
                label: "Authorized Staff Home"
            },
            {
                page: "unassigned-requests",
                label: "New Requests"
            },
            {
                page: "confidential",
                label: "Confidential Requests"
            },
            {
                page: "all-active-requests",
                label: "All Active Requests"
            }
        ]
    },
    manager: {
        title: "All Things HR | Management",

        links: [
            {
                page: "manager-home",
                label: "Management Home"
            },
            {
                page: "pending-approvals",
                label: "Pending Approval Requests"
            },
            {
                page: "my-team",
                label: "My Team"
            },
        ]
    },
};
// Function for dynamically loading page title and navigation links based on user type 
export async function loadNavigation(section) {
    const config = navigation[section];

    if (!config) {
        console.error(`Navigation configuration not found: ${section}`);
        return;
    }

    const headerTitle = document.getElementById("page-title");
    const hamburgerMenu = document.getElementById("hamburger-menu");

    headerTitle.textContent = config.title;
    const workspaceSelect = document.getElementById("workspace-select");

    if (workspaceSelect) {
        workspaceSelect.value = section;
    }



    hamburgerMenu.innerHTML = config.links.map(link => `
        <button type="button" class="menu-link" data-page="${link.page}">
            ${link.label}
        </button>
    `).join("");
} 