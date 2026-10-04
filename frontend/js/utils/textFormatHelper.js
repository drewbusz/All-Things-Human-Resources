// Text Format helper

export function formatFieldName(fieldName) { 

    if (!fieldName) { 
        return ""; 
    }

    const customNames = {
        assigned_to: "Current Owner"
    }; 

    if (customNames[fieldName]) { 
        return customNames[fieldName]; 
    }

    return fieldName
        .replaceAll("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}
