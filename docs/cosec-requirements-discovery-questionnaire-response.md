# COSEC Requirements Discovery Questionnaire Response

Date consolidated: 2026-04-28

This document consolidates:

- the returned questionnaire answers
- the supporting interpretation already derived from the returned document
- the four final follow-up clarifications received afterward

It is intended to be the maintained business-response source for the current
COSEC requirements position.

## 1. Confirmed Business Position

### 1.1 Organization And Ownership

- Official business context:
  `County Government of Vihiga Communication, Correspondence Tracking & Coordination System`
- Primary owning office:
  `Office of the County Secretary & Head of County Public Service`
- Intended operating model:
  one central coordinating office with distributed departmental execution

### 1.2 Department Structure

- There is one central control office:
  `Office of the County Secretary and Head of Public Service`
- That office handles coordination, review, routing, oversight, and closure.
- All line departments mainly act as execution units after dispatch.
- All users are expected to belong to a department.
- Communication should not move directly from one department to another without
  passing through the central office.
- Departments currently do not have official short codes.
- The system scope should include county departments and county entities such
  as:
  - `VIWASCO`
  - `Municipality`
  - `VCRH`
  - `CPSB`

### 1.3 Roles Required In The System

The intended role set is:

- `Org Admin`
- `Registry Officer`
- `Reviewing Officer`
- `Department User`
- `Management`

Operational intent:

- `Org Admin`
  - manages users, departments, and system structure
- `Registry Officer`
  - receives and registers correspondence
- `Reviewing Officer`
  - reviews correspondence
  - sets instructions
  - sets priority
  - sets confidentiality
  - sets due date
  - decides routing and dispatch
- `Department User`
  - executes assigned work and provides updates or feedback
- `Management`
  - oversight, escalation, confirmation, and closure authority

## 2. Final Follow-Up Clarifications

These answers were received after the original questionnaire response and should
be treated as the latest confirmed business position.

### 2.1 Multiple Roles

Answer:

- one user may hold multiple system roles
- those roles must be assignable by admin

Business interpretation:

- the system should support multi-role assignment for a user
- admin must control which roles are granted

### 2.2 Final Authority To Assign Or Dispatch

Answer:

- `Reviewing Officer` is the authority after review
- in practice, this is the management office holder, meaning the County
  Secretary

Business interpretation:

- the reviewer role is the final central-office routing authority

### 2.3 Registry Officer Dispatch Scope

Answer:

- the system should be able to hide or show roles based on what admin has
  assigned

Business interpretation:

- the business prefers configurable role capability over a rigid one-size-fits-
  all restriction
- registry dispatch capability should be controlled by the assigned role set and
  effective permissions

### 2.4 Management And Reviewing Officer Relationship

Answer:

- `Management (The CS)` and `Reviewing Officer` are the same office holder

Business interpretation:

- they should be treated as one effective real-world authority path in the
  workflow
- the system may still preserve both labels if needed for clarity, but should
  not assume different people by default

## 3. Receipt And Registration

Confirmed business requirements:

- documents are received through multiple channels
- intake capture must support:
  - date received
  - time received
  - sender/source
  - delivered by
  - document type/name
  - action required
- registration is handled by `Registry Officer`
- reference numbers should be system-generated
- proposed format:
  `VCG/OCS/YYYY/MM/NNNNNN`
- reference generation may vary by office or document type if the final business
  rule requires it

## 4. Review

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

Other review expectations:

- multiple reviews are allowed
- review decisions may be changed after dispatch
- audit trail must be preserved

## 5. Dispatch And Routing

Confirmed business requirements:

- dispatch is separate from assignment
- dispatch must be logged
- due date is mandatory at dispatch
- acknowledgement tracking is required
- receiving departments must confirm receipt
- movement between users or departments must be tracked
- some items may be sent to more than one department or officer

Workflow interpretation:

- central office receives and registers
- central office reviews
- reviewing officer / County Secretary makes the routing decision
- departments execute and respond

## 6. Action, Feedback, And Closure

Confirmed business requirements:

- departments or recipients perform the actual work
- feedback is mandatory before closure
- multiple feedback updates may exist
- departments may attach evidence files
- progress updates before final completion should be supported
- closure requires verification and approval
- cancellation is allowed
- reopening is allowed with justification
- overdue and urgent escalation rules are required

## 7. Document Registry And Records Management

Confirmed business requirements:

- both physical and digital document tracking are required
- the system should track:
  - current holder
  - current location
  - archive status
  - file attachments
  - linked correspondence
- documents may exist without linked correspondence
- document categories are required

Named categories:

- Administrative
- Legal
- Financial
- HR
- Policy

## 8. Meetings And Action Points

Confirmed business requirements:

- meetings generate follow-up tasks
- the system should capture:
  - agenda
  - resolutions
  - action points
  - deadlines
  - participants
  - venue
- action points may be assigned to departments and users
- deadlines are mandatory
- assigned officers update action-point status
- action points should link back to correspondence where relevant

## 9. Dashboard, Reports, And Pain Points

Required dashboard and reporting visibility:

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

Required exportable outputs:

- department performance
- SLA compliance
- correspondence logs
- audit reports
- printable summaries

Main pain points identified:

- delayed responses
- poor tracking
- lack of accountability
- missing documents

Required improvements:

- real-time tracking
- accountability
- reporting
- workflow automation

## 10. Final Consolidated Target Model

The most defensible current target model is:

- one central coordinating office:
  `Office of the County Secretary and Head of Public Service`
- central office roles:
  - `Registry Officer`
  - `Reviewing Officer`
  - `Management`, effectively the same office holder as `Reviewing Officer`
- all other departments:
  - execution destinations
  - mostly `Department User` accounts
- multi-role assignment is allowed and controlled by admin
- role visibility and effective capability should be controlled by the assigned
  role set
- the workflow is central-office-led:
  1. receive
  2. register
  3. review
  4. dispatch
  5. execute
  6. feedback
  7. verify
  8. close

## 11. Implementation Consequence

This consolidated business response implies the next system refactor should:

- support admin-controlled multi-role assignment
- treat reviewing officer / County Secretary as the effective routing authority
- align permissions to a central-office-led workflow
- preserve separate dispatch and movement tracking
- enforce mandatory feedback before closure
- preserve full auditability across the lifecycle
