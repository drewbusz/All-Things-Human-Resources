# UC-7 Highly Confidential Request Authorization Integration Test Report

Date: November 23, 2026

The current Highly Confidential authorization behavior was tested with signed-in HTTP sessions against MariaDB `all_things_hr` (10.11.16). Application code was not changed, and the database was not reset. Disposable requests 70–75 were removed after the evidence below was captured. The preexisting 19 requests, 1 approval, 50 history rows, 5 field values, 4 notes, 35 `request_auth` rows, and 11 login hashes were unchanged.

## Accounts

Roles were selected from active authorization rows, not from assumed IDs.

| Account | Employee | Authorizations used |
|---|---|---|
| Morgan Taylor | 1 | HR Manager. Type 5 with `can_update`, plus type 4 approval. The only type 5 employee. |
| Alex Johnson | 2 | Authorized HR Staff. Type 3 with `can_update`, and no type 5. |
| Serena Bossier | 3 | HR Processor. Type 6 with `can_update`, and no type 3 or 5. |
| Ethan Brooks | 4 | Second HR Processor. Type 6 with `can_update`, plus view-only type 1. |
| Casey Williams | 6 | Ordinary employee. Type 1 view only, with no HR authorization. Casey submitted the test requests. |
| Jordan Smith | 5 | Department manager. Type 4 `can_approve`, with no type 3, 5, or 6. Used to show that approval permission is not HR Manager permission. |

The main request was an Employee Information Change submitted by Casey, reviewed at intake, and assigned to Serena. It was request 70.

## UC7-01

**PASS**

- Role: Morgan Taylor, HR Manager, authorization type 5.
- API: `PATCH /api/requests/71` changed Nonconfidential to Highly Confidential and returned **200**. `PATCH /api/requests/70` changed Confidential to Highly Confidential and returned **200**.
- Expected: an HR Manager can raise either classification to Highly Confidential.
- Actual: both responses said the assignment and classification were saved. Request 70 was Highly Confidential and still assigned to employee 3.
- Database: `request.confidentiality_level` for request 70 was `Highly Confidential`.

## UC7-02

**PASS**

- Role: Alex Johnson, Authorized HR Staff, authorization type 3.
- API: `PATCH /api/requests/70` with `confidentiality_level` Highly Confidential returned **403**, "Only an HR Manager can manage Highly Confidential access."
- Expected: type 3 staff cannot make that change.
- Actual: the request stayed Confidential and no `request_auth` row was created. Jordan Smith, a department manager with approval permission, and Casey Williams, an ordinary employee, each received **403**, "You are not authorized to manage HR requests."

## UC7-03

**PASS**

- Role: Serena Bossier, the assigned HR Processor, authorization type 6.
- API: Morgan's classification call on request 70 returned **200**.
- Expected: the current assignee automatically receives an active `request_auth` row.
- Actual and database: `request_auth` 58 was active for employee 3, authorization 5, authorization type 6, with no expiration date.

## UC7-04

**FAIL**

- Role: Morgan Taylor, HR Manager, authorization type 5.
- API: `PATCH /api/requests/70` with only `authorized_employee_ids: [2]` returned **400**, "The request contains an unsupported field."
- Expected: the HR Manager can submit an additional eligible HR employee who is not the assigned processor.
- Actual: no authorization row was created for Alex. The same list sent together with `assigned_emp_id: 3` returned **200**, and the response `authorized_employee_ids` was `[2]`.
- Database: after the list-only call, only Serena's active row existed. Alex's row appeared only after the second call, which also contained an assignment field.
- Error: `backend/routes/requestRoutes.js` sends a PATCH to request management only when the body contains `request_type_id`, `assigned_emp_id`, or `confidentiality_level`. A body that contains only `authorized_employee_ids` is handled by normal request processing, which rejects the field.

## UC7-05

**PASS**

- Role: Alex Johnson, the additional employee, authorization type 3.
- API: the management update that included `assigned_emp_id` and `authorized_employee_ids: [2]` returned **200**.
- Expected: the additional employee receives active request-specific authorization.
- Database: `request_auth` 59 was active for employee 2, `auth_id` 2, authorization type 3, with no expiration date. Serena's processor row remained active.

## UC7-06

**PASS**

- Role: Alex Johnson, after the additional authorization was saved.
- API: `GET /api/requests/70` returned **200**, `GET /api/requests/70/fields` returned **200**, and `GET /api/requests/70/history` returned **200** with 10 history rows.
- Expected: the additional employee can read the request, its saved dynamic values, and its history.
- Actual: the request was Highly Confidential. Both field values matched `request_field_value`: field 1 `information_to_change` and field 2 `new_information`.

## UC7-07

**PASS**

- Role: Alex Johnson, holding additional read authorization but not the assignment.
- API: all four modification attempts returned **403**.
  - `PATCH` priority: "You are not authorized to access this Highly Confidential request."
  - `POST /api/requests/70/fields`: "You cannot edit fields on this request."
  - `POST /api/requests/70/notes`: "You cannot update this Highly Confidential request."
  - `PATCH` assignment: "Only an HR Manager can manage Highly Confidential access."
- Expected: read authorization does not permit processing or modification.
- Database: priority stayed `medium`, the assignee stayed employee 3, and the first field value was unchanged.

## UC7-08

**PASS**

- Role: Ethan Brooks, HR Processor type 6, neither assigned nor selected.
- API: `GET /api/requests/70`, `/fields`, `/history`, and `/notes` each returned **403**, "You are not authorized to access this Highly Confidential request."
- Expected: an unselected HR employee cannot read the request, its fields, its history, or its notes.
- Database: Casey had successfully added a note (`POST` **201**). Ethan still could not read the notes.

## UC7-09

**FAIL**

- Role: Morgan Taylor, HR Manager, authorization type 5.
- API: `PATCH /api/requests/70` with only `authorized_employee_ids: []` returned **400**, "The request contains an unsupported field."
- Expected: an updated list removes the previously selected employee.
- Actual: Alex's `request_auth` 59 stayed active (`is_active` 1) after the list-only update.
- Follow-up: the same empty list sent with `confidentiality_level: "Highly Confidential"` returned **200**. That second call is what deactivated the row. The list by itself never reached the authorization service, for the same routing reason as UC7-04.

## UC7-10

**PASS**

- Role: Alex Johnson, after the successful removal that accompanied the classification field.
- API: `GET /api/requests/70`, `/fields`, and `/history` each returned **403**.
- Expected: removal makes the authorization inactive and the employee loses access.
- Database: `request_auth` 59 had `is_active` 0 and an expiration timestamp. Serena's processor authorization remained active.

## UC7-11

**PASS**

- Roles: Serena Bossier, previous processor, and Ethan Brooks, new processor.
- API: `PATCH /api/requests/70` with `assigned_emp_id: 4` returned **200**.
- Expected: the new processor can process the request, and the previous processor loses automatic access unless another authorization still applies.
- Actual:
  - Serena's read returned **403**. Her attempt to change priority returned **403**.
  - Ethan's read returned **200**. His priority update returned **200**, and the priority became `low`.
  - On request 72, reassignment to Ethan while `authorized_employee_ids` still contained Serena returned **200**. Serena could read that request (**200**) but could not change it (**403**). Ethan could update it (**200**).
- Database: on request 70, Serena's row was inactive and Ethan's new row was active. On request 72, both had an active row, and the response list contained Serena but not the new assignee.

## UC7-12

**PASS**

- Role: Morgan Taylor, HR Manager.
- API: `PATCH /api/requests/70` with `confidentiality_level: "Confidential"` returned **200**.
- Expected: removing Highly Confidential deactivates the request-specific authorizations.
- Database: before the change, Ethan's authorization was active. After it, request 70 was Confidential and every `request_auth` row for that request was inactive.

## UC7-13

**PASS**

- Role: Morgan Taylor, HR Manager.
- API on request 73:
  - Duplicate IDs, sent with a classification change, returned **400**, "Select valid, unique authorized employees."
  - Values `0`, `-3`, and `"abc"`, sent without another management field, returned **400**, "The request contains an unsupported field."
  - Casey Williams, an ordinary employee, included with a classification and priority change, returned **409**, "Additional users must have active HR staff or processor authorization."
  - Jordan Smith, a department manager with only approval permission, returned the same **409**.
- Expected: invalid values, duplicates, and ineligible employees are rejected without a partial update.
- Database: request 73 stayed Confidential, priority stayed `medium`, assignee stayed Serena, `request_auth` stayed empty, and the tracked history count stayed 2. The ineligible updates rolled back.

## UC7-14

**PASS**

- Role: Morgan Taylor, employee 1, for the authorization changes; Ethan Brooks, employee 4, for his later priority edit.
- Database `request_history` for request 70 included:
  - `confidentiality_level` from Confidential to Highly Confidential.
  - `request_authorization` blank to `granted:3` for Serena.
  - `request_authorization` blank to `granted:2`, then `granted:2` to `revoked:2`, for Alex.
  - `assigned_emp_id` from 3 to 4, with Serena `revoked:3` and Ethan `granted:4`.
  - `confidentiality_level` from Highly Confidential back to Confidential, with Ethan `revoked:4`.
- The rejected list-only calls did not add history rows. The changes that committed were recorded.

## UC7-15

**PASS**

- Role: Morgan Taylor made the first assignments. Alex Johnson, Authorized HR Staff type 3, reassigned both requests.
- API: assignment and reassignment of a Confidential request and a Nonconfidential request each returned **200**.
- Expected: ordinary assignment still works and does not create request-specific authorization.
- Database: both requests ended assigned to Ethan. Their classifications stayed Confidential and Nonconfidential. Neither request had a `request_auth` row.

## UC7-16

**PASS**

- Role: Alex Johnson, Authorized HR Staff type 3, while he was not authorized for request 70. Morgan Taylor was the comparison.
- API: `GET /api/requests/active` returned **200** for both.
- Expected: unauthorized type 3 staff do not see the Highly Confidential request, while ordinary requests remain visible.
- Actual: Alex's list did not contain request 70 before the grant or after the removal. Morgan's list did contain it. After the ordinary requests existed, Alex's list contained both the Confidential and Nonconfidential test requests.

## Option B

Option B is the request-specific model in the current management service: the HR Manager classifies a request as Highly Confidential, the assigned processor automatically receives processing access, and `authorized_employee_ids` gives other eligible HR employees read access without giving them processing access.

That model meets the core UC-7 access rules. Type 5 is required for the classification and for the access list. Type 3 staff, type 6 processors who were not selected, ordinary employees, and department managers who only have approval permission are kept out. Additional read access does not allow edits. Reassignment moves processing access, an explicit list entry preserves read access, removing the classification deactivates the request authorizations, invalid lists roll back, and history records the committed changes. Nonconfidential and Confidential assignment is unchanged, and the active list does not leak the Highly Confidential request to unauthorized HR staff.

Option B does not fully meet the update requirement. An HR Manager cannot submit or clear `authorized_employee_ids` unless the same PATCH also contains an assignment, classification, or request-type field.

## Required fixes

1. Route `authorized_employee_ids` to request management. In `backend/routes/requestRoutes.js`, the PATCH dispatcher only treats `request_type_id`, `assigned_emp_id`, and `confidentiality_level` as management fields. A list-only update falls through to normal processing and returns 400, "The request contains an unsupported field," without changing `request_auth`. The management service already grants, removes, validates, and records the list when the request reaches it.
