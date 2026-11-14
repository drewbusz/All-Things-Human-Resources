// requestRender utility

import {
    formatDateForInput,
    formatDateForDisplay,
} from "../utils/dateHelper.js";

import {
    formatFieldName
} from "../utils/textFormatHelper.js";


// PROCESS REQUEST FORM
export function renderProcessRequestForm(
    request,
    workflowSteps,
    //requestFields
) {

   // const fieldRows = renderFieldRows(requestFields);

    const statusOptions = renderStatusOptions(
        workflowSteps,
        request.current_step_id
    );

    const requestForm = document.createElement("form");
    requestForm.id = "process-request-form";

    requestForm.innerHTML = `
        <div class="card">

            <h3>
                HR Request Processing | Request ID: ${request.request_id} | Current Owner: ${formatFieldName(request.assigned_to)}
            </h3>

            <hr>

            <div id="request-fields">
               
            </div>

            <hr>

            <div class="process-form-layout">

                <div class="form-column">

                    <div class="form-field">
                        <label for="expected-completion">
                            Expected Completion
                        </label>

                        <input
                            type="date"
                            id="expected-completion"
                            name="expected_completion"
                            value="${formatDateForInput(request.expected_completion)}"
                        >
                    </div>


                    <div class="form-field">
                        <label for="current-step-id">
                            Current Status
                        </label>

                        <select
                            id="current-step-id"
                            name="current_step_id"
                            required
                        >
                            ${statusOptions}
                        </select>
                    </div>


                    <div class="form-field">
                        <label for="request-priority">
                            Priority Level
                        </label>

                        <select
                            id="request-priority"
                            name="priority_level"
                        >
                            <option
                                value=""
                                ${!request.priority_level
                                ? "selected"
                                : ""}
                            >
                            </option>

                            <option
                                value="low"
                                ${request.priority_level === "low"
                                ? "selected"
                                : ""}
                            >
                                Low
                            </option>

                            <option
                                value="medium"
                                ${request.priority_level === "medium"
                                ? "selected"
                                : ""}
                            >
                                Medium
                            </option>

                            <option
                                value="high"
                                ${request.priority_level === "high"
                                ? "selected"
                                : ""}
                            >
                                High
                            </option>
                        </select>
                    </div>
                </div>


                <div class="form-column">

                    <div class="form-field summary-field">

                        <label for="request-summary">
                            Summary
                        </label>

                        <textarea
                            id="request-summary"
                            name="brief_summary"
                        ></textarea>
                    </div>
                </div>
            </div>
            <div class="form-actions">
            <button type="button" id="back-button">Back</button>
                <p class="feedback"></p>
                <button type="submit">Save Assignment</button>
            </div>
        </div>
    `;
    // Safely populate the request summary as text 
    const summaryInput =
        requestForm.querySelector("#request-summary"); 

    summaryInput.value =
        request.brief_summary ?? "";

    return requestForm;
}

// AUTHORIZED STAFF > ASSIGN & CLASSIFY FORM
export function renderAuthorizedRequestProcessingForm(
    request,
    employeeOptions, 
    activeRequestTypes
) {
    
    const requestForm = document.createElement("form");
    requestForm.id = "assignment-form";

    requestForm.innerHTML = `
        <div class="card">
            <h3>Request Fields</h3>
            <div id="request-fields"></div>

            <hr>

            <div class="form-field">
                <label for="assigned-employee">Assigned To</label>
                <select id="assigned-employee" required>
                    <option value="">Select HR Employee</option>
                </select>
            </div>

            <div class="form-field">
                <label for="request-type">Request Type</label>
                <select id="request-type" required>
                    <option value="">Select a Request Type</option>
                </select>
            </div>

            <div class="form-field">
                <label for="assignment-priority">Priority Level</label>
                <select id="assignment-priority" required>
                    <option value="">Select Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>

            <div class="form-field">
                <label for="assignment-completion">
                    Expected Completion
                </label>
                <input
                    type="date"
                    id="assignment-completion"
                    required
                >
            </div>

            <div class="form-actions">
                <button type="back" id="back-button">
                    Back
                </button>
                <p id="assignment-message" class="feedback" role="status"></p>
                <button type="submit">Save Assignment</button>
            </div>

            

            

        </div>
    `;
    // Populate assignable employees
    const employeeSelect =
        requestForm.querySelector("#assigned-employee");

    if (employeeOptions.length === 0) {
        const option = document.createElement("option"); 

        option.value = ""; 
        option.textContent =
            "No assignable employees available."; 

        employeeSelect.appendChild(option); 
        employeeSelect.disabled = true; 

    } else { 
        employeeOptions.forEach(employee => {

            const option = document.createElement("option");

            option.value = employee.employee_id;
            option.textContent =
                `${employee.first_name} ${employee.last_name}`;

            employeeSelect.appendChild(option);
        });

        // Select existing assigned employee
        employeeSelect.value =
            String(request.assigned_emp_id ?? "");
    }

    // Populate active request types
    const requestTypeSelect =
        requestForm.querySelector("#request-type");

    if (activeRequestTypes.length === 0) {
        const option = document.createElement("option");

        option.value = "";
        option.textContent = "No active request types available.";

        requestTypeSelect.appendChild(option);
        requestTypeSelect.disabled = true;
    } else { 
        activeRequestTypes.forEach(type => {

            const option =
                document.createElement("option");

            option.value =
                Number(type.request_type_id);

            option.textContent =
                formatFieldName(type.name); 

            requestTypeSelect.appendChild(option);
        });
        // Select existing request type
        requestTypeSelect.value =
            String(Number(request.request_type_id ?? ""));
    }

    // If both are empty, allow the page to load but disable form submission

    if (
        employeeOptions.length === 0 ||
        activeRequestTypes.length === 0
    ) {
        requestForm.querySelector(
            'button[type="submit"]'
        ).disabled = true;
    }

    // Populate existing priority
    requestForm.querySelector("#assignment-priority").value =
        request.priority_level ?? "";

    // Populate existing completion date
    requestForm.querySelector("#assignment-completion").value =
        formatDateForInput(request.expected_completion) ?? "";

    return requestForm;
}

// REQUEST HISTORY
export function loadRequestHistory(
    activityContent,
    requestHistory
) {
    activityContent.innerHTML = ``; 

    const header =
        document.createElement("div"); 

    header.classList.add("history-header"); 

    header.innerHTML = `
        <span>Date</span>
        <span>Changed By</span>
        <span>Field</span>
        <span>Change</span>
    `;

    activityContent.appendChild(header); 

    const historyList = document.createElement("div"); 
    historyList.classList.add("history-list"); 

    const historyRows =
        renderHistoryRows(requestHistory); 

    if (historyRows.length === 0) {
        const empty = document.createElement("p");

        empty.classList.add("history-empty");

        empty.textContent =
            "No request history is available.";

        historyList.appendChild(empty);
    } else { 
        historyRows.forEach(row => { 
            historyList.appendChild(row); 
        }); 
    }
    activityContent.appendChild(historyList); 
}

// REQUEST NOTES
export function loadRequestNotes(
    activityContent,
    requestNotes
) {
    activityContent.innerHTML = ""; 

    const addNote = document.createElement("div"); 
    addNote.classList.add("add-note"); 

    addNote.innerHTML = `
            <label for= "new-note">
                Add Note
            </label>

            <textarea
                id="new-note"
                name="new-note"
                rows="4"
                placeHolder="Enter a note..."
            ></textarea>

            <button
                type="button"
                id="add-note-button"
             >
                Add Note
            </button>
            <p id="note-message"></p>
        `;

    activityContent.appendChild(addNote); 

    const divider = document.createElement("hr"); 
    activityContent.appendChild(divider); 

    const header = document.createElement("div"); 
    header.classList.add("notes-header"); 

    header.innerHTML = `
        <span>Date</span>
        <span>Created By</span>
        <span>Note</span>
    `; 

    activityContent.appendChild(header); 

    const notesList = document.createElement("div"); 
    notesList.classList.add("notes-list"); 

    const noteRows = renderNoteRows(requestNotes); 

    if (noteRows.length === 0) { 
        const empty = document.createElement("p"); 
        empty.classList.add("notes-empty"); 

        empty.textContent =
            "No request notes are available."; 

        notesList.appendChild(empty); 
    } else { 
        noteRows.forEach(row => { 
            notesList.appendChild(row); 
        }); 
    }

    activityContent.appendChild(notesList); 

     
        
}

// REQUEST ROWS
export function renderRequestRows(requests) { 

    const requestRows = requests.map(request => `
    <div class="item-card"
         id="assigned-item-${request.request_id}"
         data-request-id="${request.request_id}"
    >

        <div class="assigned-item-content">

            <h3>#${request.request_id} - ${request.request_type}</h3>

            <div class="assigned-item-details">

                <div class="assigned-detail">
                    <span class="detail-label">Submitted By</span>
                    <span class="detail-value">${request.submitted_by}</span>
                </div>

                <div class="assigned-detail">
                    <span class="detail-label">Submitted Date</span>
                    <span class="detail-value">
                        ${formatDateForDisplay(request.submission_date)}
                    </span>
                </div>

                <div class="assigned-detail">
                    <span class="detail-label">Priority</span>
                    <span class="detail-value">${formatFieldName(request.priority_level) || "None Selected"}</span>
                </div>

                <div class="assigned-detail">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">${request.status}</span>
                </div>
                <div class="assigned-detail">
                    <span class="detail-label">Current Owner</span>
                    <span class="detail-value">${formatFieldName(request.assigned_to) || "None Selected"}</span>
                </div>

            </div>

        </div>

        <button type="button" class="item-action">
            View Request →
        </button>

    </div>
`).join("");

    return requestRows; 

}

// FIELD ROWS
function renderFieldRows(requestFields) {

    const fieldRows =
        requestFields.map(field => {

            const required =
                field.is_required
                    ? "required"
                    : "";

            const value =
                field.field_val ?? "";

            let fieldInput;


            switch (field.field_type) {

                case "date":

                    fieldInput = `
                        <input
                            type="date"
                            id="field-${field.field_id}"
                            data-field-id="${field.field_id}"
                            value="${formatDateForInput(value)}"
                            ${required}
                        >
                    `;

                    break;


                case "number":

                    fieldInput = `
                        <input
                            type="number"
                            id="field-${field.field_id}"
                            data-field-id="${field.field_id}"
                            value="${value}"
                            ${required}
                        >
                    `;

                    break;


                case "textarea":

                    fieldInput = `
                        <textarea
                            id="field-${field.field_id}"
                            data-field-id="${field.field_id}"
                            ${required}
                        >${value}</textarea>
                    `;

                    break;


                default:

                    fieldInput = `
                        <input
                            type="text"
                            id="field-${field.field_id}"
                            data-field-id="${field.field_id}"
                            value="${value}"
                            ${required}
                        >
                    `;
            }


            return `
                <div class="field-item">

                    <label
                        class="field-label"
                        for="field-${field.field_id}"
                    >
                        ${field.field_label}
                    </label>

                    <div class="field-value">
                        ${fieldInput}
                    </div>

                </div>
            `;

        }).join("");


    return fieldRows;
}

// STATUS OPTIONS
function renderStatusOptions(
    workflowSteps,
    currentStepId
) {

    const statusOptions =
        workflowSteps.map(step => {

            const selected =
                Number(step.workflow_step_id) ===
                    Number(currentStepId)
                    ? "selected"
                    : "";


            return `
                <option
                    value="${step.workflow_step_id}"
                    ${selected}
                >
                    ${step.step_name}
                </option>
            `;

        }).join("");


    return statusOptions;
}

// HISTORY ROWS
function renderHistoryRows(requestHistory) {

    return requestHistory.map(history => {

        const row = document.createElement("div"); 

        row.classList.add("history-item"); 

        const date =
            document.createElement("span"); 

        date.classList.add("history-date");

        date.textContent =
            formatDateForDisplay(
                history.date_modified
            ); 

        const changedBy =
            document.createElement("span"); 

        changedBy.classList.add("history-user");  

        changedBy.textContent =
            formatFieldName(
                history.changed_by
            ); 

        const field = 
            document.createElement("span");

        field.classList.add("history-field");

        field.textContent =
            formatFieldName(
                history.modified_field
            );

        const change =
            document.createElement("span"); 

        change.classList.add("history-change");

        change.textContent =
            `${history.previous_value ?? ""}  >  ${history.current_value ?? ""}`; 

        row.appendChild(date);
        row.appendChild(changedBy);
        row.appendChild(field);
        row.appendChild(change);

        return row; 

    });
} 

// NOTE ROWS
function renderNoteRows(requestNotes) {

    return requestNotes.map(note => { 

        const row = document.createElement("div"); 
                row.classList.add("note-item"); 

        const date = document.createElement("span"); 
        date.classList.add("note-date"); 

        date.textContent = 
            formatDateForDisplay(
                note.note_date
            ); 

        const createdBy =
            document.createElement("span"); 

        createdBy.textContent = 
        formatFieldName( 
                note.created_by
            ); 

        const noteText = 
            document.createElement("span"); 

        noteText.classList.add("note-text"); 

        noteText.textContent = note.note; 

        row.appendChild(date); 
        row.appendChild(createdBy); 
        row.appendChild(noteText); 

        return row; 
    }); 
}