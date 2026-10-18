// employee front end API calls

// Retrieve active employees with the required authorization.
// Auth type 3 identifies employees permitted to process HR requests.
export async function getEmployeesByAuthType(authTypeId) {
    const response = await fetch(
        `/api/employees/by-auth-type/${authTypeId}`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            "Unable to retrieve HR employees."
        );
    }

    return result.data;
}

export async function getAssignableEmployees() { 
    const response = await fetch(
        `/api/employees/eligible-assignees`
    ); 

    const result = await response.json(); 

    if (!response.ok) { 
        throw new Error(
            result.message ||
            result.error ||
            "Unable to locate assignable HR employees."
        ); 
    }
    return result.data; 
}