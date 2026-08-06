# COSEC Requirements Response Analysis

Date: 2026-04-28

Source reviewed:

- [COSEC Requirements Discovery Questionnaire.docx](D:/active_projects/cosec-comm-system/docs/COSEC%20Requirements%20Discovery%20Questionnaire.docx)
- [cosec-requirements-discovery-questionnaire.md](D:/active_projects/cosec-comm-system/docs/cosec-requirements-discovery-questionnaire.md)
- [AGENTS.md](D:/active_projects/cosec-comm-system/AGENTS.md)
- [Roadmap.md](D:/active_projects/cosec-comm-system/Roadmap.md)
- [README.md](D:/active_projects/cosec-comm-system/README.md)
- [CORRESPONDENCES TRACKING SYSTEM.docx](D:/active_projects/cosec-comm-system/docs/CORRESPONDENCES%20TRACKING%20SYSTEM.docx)
- [Copy of Dashboard*-\_Office_of_the_County_Secretary*&_Head_of_Public_Service_-\_FINAL(1).xlsx](<D:/active_projects/cosec-comm-system/docs/Copy%20of%20Dashboard_-_Office_of_the_County_Secretary_%26_Head_of_Public_Service_-_FINAL(1).xlsx>)

## 1. Executive Summary

The returned questionnaire is strong enough to drive the next round of system
refactoring.

The main business direction is now clear:

- the system should model one central coordinating office
- all other departments mainly act as execution units
- correspondence must move through controlled central-office handling
- tracking, dispatch, auditability, feedback, and closure are all required
- the system is expected to support both physical and digital document tracking
- meetings, action points, dashboard reporting, and exportable reports are all
  real requirements

The follow-up clarifications have now been received. The earlier contradictions
around role overlap, assignment authority, and registry scope are resolved
enough to drive the next role and workflow refactor.

## 2. Confirmed Business Requirements

### 2.1 Organization Model

- Official system name:
  `County Government of Vihiga Communication, Correspondence Tracking & Coordination System`
- Primary owning office:
  `Office of the County Secretary & Head of County Public Service`
- Intended operating model:
  one central coordinating office with distributed departmental execution
- The system is not only for the CS office in isolation. It must cover all
  county departments and county entities.

### 2.2 Department Structure

- There is one central office:
  `Office of the County Secretary and Head of Public Service`
- That central office is the coordinating control point.
- All line departments act as execution units after dispatch.
- All users must belong to a department.
- Cross-department communication should not happen directly. It must pass
  through the CS office as the coordinating office.
- Departments currently do not have official short codes.
- The stated requirement is broad:
  all departments plus county entities such as `VIWASCO`, `Municipality`,
  `VCRH`, and `CPSB` should exist in the system.

### 2.3 Role Intent

The following role model is intended:

- `Org Admin`
- `Registry Officer`
- `Reviewing Officer`
- `Department User`
- `Management`

Operational intent by role:

- `Registry Officer`
  - receives and registers correspondence
- `Reviewing Officer`
  - reviews items
  - sets instructions
  - sets priority
  - sets due date
  - routes work
- `Department User`
  - executes assigned work only
- `Management`
  - oversight
  - confirmation
  - closure authority

### 2.4 Central Office Responsibilities

The user explicitly described the central office as responsible for:

- registration and control of all correspondence
- review and decision-making
- dispatch and routing
- oversight and closure

This means the system should not treat all departments as equals in workflow
authority. It should reflect a central-office-led operating model.

### 2.5 Receipt And Registration

The user confirmed:

- documents are received through multiple channels
- registration is the responsibility of the `Registry Officer`
- the following intake details must be captured immediately:
  - date received
  - time received
  - source/sender
  - delivered by
  - document type/name
  - action required
- reference numbers should be system-generated
- proposed format:
  `VCG/OCS/YYYY/MM/NNNNNN`
- reference generation may need to vary by department or document type

### 2.6 Review Requirements

Review must support:

- instructions
- priority setting
- confidentiality setting
- due date setting
- assignment decision

Priority levels confirmed:

- Normal
- Urgent
- Very Urgent
- Critical

Confidentiality levels confirmed:

- Public
- Internal
- Confidential
- Highly Confidential

Other confirmed review behaviors:

- multiple reviews are allowed
- review decisions may be changed after dispatch
- such changes must keep an audit trail

### 2.7 Dispatch And Routing

The user confirmed:

- dispatch should be separate from assignment
- dispatch must be fully logged
- due date is mandatory at dispatch
- acknowledgement tracking is required
- receiving departments must confirm receipt
- movement between users or departments must be tracked for full audit trail
- some items may be sent to more than one department or officer

### 2.8 Action And Feedback

The user confirmed:

- departments or recipients perform the actual work
- feedback is mandatory before closure
- multiple feedback updates may exist
- departments should be able to attach files as evidence
- progress updates before final completion must be supported

### 2.9 Closure And Escalation

The user confirmed:

- closure is allowed only after verification and approval
- cancellation is allowed
- reopening is allowed with justification
- closure approval is required
- overdue and urgent escalation rules are required
- notifications for delayed or overdue items should go to:
  - `Management`
  - `Reviewing Officer`

### 2.10 Document Registry

The user confirmed:

- both physical and digital document tracking are required
- the system should track:
  - current holder
  - current location
  - archive status
  - file attachments
  - linked correspondence
- documents may exist without a linked correspondence item
- document categories are required

Named categories provided:

- Administrative
- Legal
- Financial
- HR
- Policy

Other registry expectations:

- archived documents must remain searchable
- there are records-management requirements for archive handling

### 2.11 Meetings And Action Points

The user confirmed:

- meetings generate follow-up tasks
- the system should capture:
  - agenda
  - resolutions
  - action points
  - deadlines
  - participants
  - venue
- action points may be assigned to both departments and users
- deadlines are mandatory
- assigned officers update action-point status
- action points should be linked back to correspondence where relevant

### 2.12 Dashboard, Reports, And Alerts

The user confirmed the need for:

- total correspondence
- pending items
- overdue items
- urgent items
- department performance
- SLA compliance
- trends over time
- average response time
- pending dispatches
- pending action points

Exportable reports required:

- department performance
- SLA compliance
- correspondence logs
- audit reports

Other expectations:

- printable summaries are required
- management should have full dashboard and reporting access

### 2.13 Current Pain Points

The user explicitly identified these major problems:

- delayed responses
- poor tracking
- lack of accountability
- missing documents

The improvements required immediately are:

- real-time tracking
- accountability
- reporting
- workflow automation

## 3. Resolved Clarifications

### 3.1 Multiple Roles

Resolved answer:

- one user may hold multiple system roles
- the role combination must be assignable and controllable by admin

Implication:

- the membership model must support more than one effective business role per
  user
- admin must be able to determine which roles are active for a user

### 3.2 Final Assignment And Dispatch Authority

Resolved answer:

- `Reviewing Officer` is the effective authority for assignment and dispatch
- in practice, this is the County Secretary / management office holder

Implication:

- the workflow should be reviewer-led
- the reviewer role should be modeled as the central decision authority for
  routing

### 3.3 Registry Scope

Resolved answer:

- the business does not want a rigid single answer
- the system should be able to hide or show roles and capabilities based on
  what the admin has assigned

Interpretation to implement:

- registry behavior should be permission-driven, not hard-coded only by role
  name
- if admin grants dispatch capability through the assigned role set, the user
  may dispatch after review

### 3.4 Reviewing Officer And Management

Resolved answer:

- `Management (The CS)` and `Reviewing Officer` represent the same office
  holder with overlapping responsibilities

Implication:

- these should not be modeled as two strictly separate real-world actors in the
  workflow
- the system may still retain both labels conceptually, but the target model
  should treat them as the same central-office authority unless later business
  rules require separation

### 3.5 Reference Number Variation

The user asked for:

- system-generated references
- format including office and date segments
- possible variation by department or document type

Why this matters:

- we need to know whether correspondence uses one global CS-office sequence
  or separate departmental/document-type sequences

## 4. Recommended Interpretation After Clarification

Based on the returned questionnaire and the resolved follow-up answers, the
target operating model is:

- one central office department:
  `Office of the County Secretary & Head of County Public Service`
- central-office roles:
  - `Registry Officer`
  - `Reviewing Officer`
  - `Management`, effectively represented by the same office holder as
    `Reviewing Officer`
- all other departments:
  - execution destinations
  - mostly `Department User` accounts
- line departments do not directly bypass the CS office for routing
- one user may hold multiple roles where the admin assigns them
- role visibility and capability should be controllable by admin assignment

Likely workflow intention:

1. Registry receives and registers
2. Reviewing Officer reviews and records instructions
3. Reviewing Officer / County Secretary owns the final routing decision
4. Departments execute
5. Departments submit feedback and evidence
6. Reviewing Officer / County Secretary verifies and closes

This is close to the current implemented system, but it requires the role model
to move from a simple single-role interpretation into an admin-controlled
multi-role central-office workflow.

## 5. System And Roadmap Implications

Assuming the contradictions are clarified, the next refactor will likely need to
touch these areas:

### 5.1 Department Model

- introduce or prioritize one central office department
- represent all operational departments as execution units
- ensure all users require department membership

### 5.2 Role Matrix

- tighten central-office roles vs execution roles
- support multiple role-holding per user
- treat management and reviewer as the same effective office-holder path unless
  a later business rule separates them
- make role visibility and capability admin-controlled where practical

### 5.3 Correspondence Workflow

- reflect CS-office-controlled routing more explicitly
- ensure dispatch remains separate from assignment
- enforce mandatory feedback before closure
- support reopen with justification

### 5.4 Reference Number Logic

- replace the current generic generated pattern if needed
- support final approved county format
- decide whether one central sequence or segmented sequences are required

### 5.5 Dashboard And Reporting

- ensure management-focused reporting is first-class
- emphasize SLA and department performance
- keep printable/exportable outputs aligned with the workbook expectations

## 6. Recommended Next Step

Use the clarified answers above to:

- finalize the target role model
- refactor the role matrix toward admin-controlled multi-role assignment
- align assignment and dispatch authority with the reviewing officer / County
  Secretary office holder
- tighten the central-office workflow design
- update the roadmap and implementation slices accordingly
