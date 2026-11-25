
﻿// Shared date formatting functions

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

    const value = String(dateValue);

    // Date-only values should not be converted from UTC.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);

        return new Date(year, month - 1, day).toLocaleDateString();
    }

    // Preserve existing formatting for timestamps.
    const date = new Date(dateValue);
    return date.toLocaleDateString();
}
