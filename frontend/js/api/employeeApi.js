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
            result.message || "Unable to retrieve HR employees."
        );
    }

    return result.data;
}

export async function getEmployeeByIdAndAuthType(employeeId, authTypeId) { 

}