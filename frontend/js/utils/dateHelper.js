// Shared date formatting functions

export function formatDateForInput(dateValue) { 
    if (!dateValue) { 
        return ""; 
    }

    return String(dateValue).substring(0, 10); 
}

export function formatDateForDisplay(dateValue) { 

    if (!dateValue) {
        return "";
    }

    const date = new Date(dateValue); 
    return date.toLocaleDateString(); 

}

