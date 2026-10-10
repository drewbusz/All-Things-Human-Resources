// requestRender utility

import {
    formatDateForInput,
    formatDateForDisplay,
} from "../utils/dateHelper.js";

import {
    formatFieldName
} from "../utils/textFormatHelper.js";

import {
    saveRequestNote
} from "../api/requestApi.js";


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
                HR Request Processing | Request ID: ${request.request_id}
            </h3>

            <hr>

            <div class="request-fields">
               // Request Fields and Values     //<br>
               // Pending backend implementation//
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
                            value="${formatDateForInput(
        request.expected_completion
    )}"
                        >
                    </div>


                    <div class="form-field">
                        <label for="current-step-id">
                            Current Status
                        </label>

                        <select
                            id="current-step-id"
                            name="current-status"
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


                    <div class="form-field">
                        <label for="confidentiality-level">
                            Confidentiality
                        </label>

                        <select
                            id="confidentiality-level"
                            name="confidentiality-level"
                        >

                            <option
                                value=""
                                ${!request.confidentiality_level
            ? "selected"
            : ""}
                            >
                            </option>

                            <option
                                value="Nonconfidential"
                                ${request.confidentiality_level ===
            "Nonconfidential"
            ? "selected"
            : ""}
                            >
                                Nonconfidential
                            </option>

                            <option
                                value="Confidential"
                                ${request.confidentiality_level ===
            "Confidential"
            ? "selected"
            : ""}
                            >
                                Confidential
                            </option>

                            <option
                                value="Highly Confidential"
                                ${request.confidentiality_level ===
            "Highly Confidential"
            ? "selected"
            : ""}
                            >
                                Highly Confidential
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
                        >${request.brief_summary ?? ""}</textarea>

                    </div>

                </div>

            </div>

            <hr>

            <button type="submit">
                Save Changes
            </button>

            <p id="request-message"></p>

        </div>
    `;

    return requestForm;
}


// REQUEST HISTORY

export function loadRequestHistory(
    activityContent,
    requestHistory
) {

    const historyRows =
        renderHistoryRows(requestHistory);

    activityContent.innerHTML = `
        <div class="history-header">
            <span>Date</span>
            <span>Changed By</span>
            <span>Field</span>
            <span>Change</span>
        </div>

        <div class="history-list">

            ${historyRows || `
                <p class="history-empty">
                    No request history is available.
                </p>
            `}

        </div>
    `;
}

 
// REQUEST NOTES

export function loadRequestNotes(
    activityContent,
    requestNotes,
    requestId,
    actingEmployeeId
) {

    const noteRows =
        renderNoteRows(requestNotes);

    activityContent.innerHTML = `
        <div class="add-note">

            <label for="new-note">
                Add Note
            </label>

            <textarea
                id="new-note"
                name="new-note"
                rows="4"
                placeholder="Enter a note..."
            ></textarea>

            <button
                type="button"
                id="add-note-button"
            >
                Add Note
            </button>

            <p id="note-message"></p>

        </div>

        <hr>

        <div class="notes-header">
            <span>Date</span>
            <span>Created By</span>
            <span>Note</span>
        </div>

        <div class="notes-list">

            ${noteRows || `
                <p class="notes-empty">
                    No request notes are available.
                </p>
            `}

        </div>
    `;


    const addNoteButton =
        activityContent.querySelector(
            "#add-note-button"
        );

    addNoteButton.addEventListener(
        "click",
        async () => {

            const noteText =
                activityContent
                    .querySelector("#new-note")
                    .value
                    .trim();

            const noteMessage =
                activityContent
                    .querySelector("#note-message");


            if (!noteText) {

                noteMessage.textContent =
                    "Enter a note before submitting.";

                return;
            }


            try {

                await saveRequestNote(
                    noteText,
                    requestId,
                    actingEmployeeId
                );

                noteMessage.textContent =
                    "Note added successfully.";

            } catch (error) {

                console.error(error);

                noteMessage.textContent =
                    error.message ||
                    "Unable to save note.";
            }
        }
    );
}

export function renderRequestRows(requests) { 

    const requestRows = requests.map(request => `
    <div class="assigned-item-card"
         id="assigned-item-${request.request_id}"
         data-request-id="${request.request_id}"
    >

        <div class="assigned-item-content">

            <h3>${request.request_type}</h3>

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
                    <span class="detail-value">${request.priority_level ?? ""}</span>
                </div>

                <div class="assigned-detail">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">${request.status}</span>
                </div>

            </div>

        </div>

        <div class="assigned-item-action">
            View Request →
        </div>

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

    const historyRows =
        requestHistory.map(history => `

            <div class="history-item">

                <span class="history-date">
                    ${formatDateForDisplay(
            history.date_modified
        )}
                </span>

                <span class="history-user">
                    ${history.changed_by}
                </span>

                <span class="history-field">
                    ${formatFieldName(
            history.modified_field
        )}
                </span>

                <span class="history-change">
                    ${history.previous_value ?? ""}
                    >
                    ${history.current_value ?? ""}
                </span>

            </div>

        `).join("");


    return historyRows;
}


// NOTE ROWS

function renderNoteRows(requestNotes) {

    const noteRows =
        requestNotes.map(note => `

            <div class="note-item">

                <span class="note-date">
                    ${formatDateForDisplay(
            note.note_date
        )}
                </span>

                <span class="note-user">
                    ${note.created_by}
                </span>

                <span class="note-text">
                    ${note.note}
                </span>

            </div>

        `).join("");


    return noteRows;
}