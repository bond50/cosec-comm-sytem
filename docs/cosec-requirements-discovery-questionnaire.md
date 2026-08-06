# COSEC Requirements Discovery Questionnaire

## Purpose

This questionnaire is intended to collect the real operational requirements for
the COSEC Communication System before any further refactoring or workflow
changes are made.

The goal is to understand:

- the real office structure
- the actual day-to-day workflow
- who performs which responsibilities
- how documents and correspondence currently move
- what pain points must be solved
- what reports and visibility are expected

This document should be completed by the business owner, process owner, or the
most knowledgeable users from the Office of the County Secretary and Head of
Public Service.

It should be treated as the business reference for:

- role design
- department setup
- workflow design
- validation rules
- dashboard and reporting requirements
- migration from the current Excel process

## Instructions For Completing This Questionnaire

Please answer as practically as possible.

Where useful, provide:

- examples from daily work
- actual document flow descriptions
- exceptions and special cases
- real formats in use today

If a question does not apply, write `Not applicable`.

If the answer depends on the type of correspondence, please explain the
difference clearly.

## Section 1: Organization Profile

1. What is the full official organization name to be used in the system?
2. What office or directorate will primarily own this system?
3. Will this system be used only by the Office of the County Secretary and Head
   of Public Service, or by other county offices as well?
4. Is this intended to be one central office workflow, or a workflow shared
   across multiple departments?
5. Are there any sub-offices, units, or sections within the main office that
   must also be represented?

## Section 2: Department Structure

1. What departments or offices should exist in the system?
2. Do departments have official short codes? If yes, please list them.
3. How many departments should be created initially?
4. Can departments send or route documents to each other?
5. Is there one central department called `Office of the County Secretary and
Head of Public Service` that should contain central decision-makers and
   handlers?
6. If yes, which roles belong inside that central office?
7. Which departments mainly act as execution departments after review and
   dispatch?
8. Should all users belong to a department, or can some users operate without a
   department assignment?

## Section 3: Roles In The System

Please confirm which of the following roles should exist in the system and what
each role should be allowed to do.

- `Org Admin`: manages users, departments, and system structure
- `Registry Officer`: receives and registers correspondence
- `Reviewing Officer`: reviews correspondence, gives instructions, and routes it
- `Department User`: works on items assigned to a department
- `Management`: oversight role for visibility, escalation, and closure decisions

Questions:

1. Which of the above roles should exist in the final system?
2. Are there any additional roles not listed above?
3. Who receives documents first?
4. Who registers documents?
5. Who reviews documents?
6. Who assigns work?
7. Who performs the actual departmental task?
8. Who confirms completion?
9. Who closes items?
10. Can one person perform multiple roles?
11. If yes, which role combinations are allowed in practice?
12. Should `Management` be a separate oversight role only, or should it also
    perform the work of `Registry Officer` and/or `Reviewing Officer`?
13. Should `Registry Officer` only register items, or should that role also be
    allowed to dispatch correspondence after review?
14. Should `Reviewing Officer` be the main role responsible for instructions,
    assignment, dispatch decisions, and closure?
15. In departments such as `Transport`, `Legal`, and `Public Service`, should
    users mostly be `Department User` only, without registry or reviewing
    powers?

## Section 4: Preferred Department And Role Arrangement

1. Should `Registry Officer`, `Reviewing Officer`, and `Management` all belong
   to one central department called `Office of the County Secretary and Head of
Public Service`?
2. Or should each role be placed directly under different departments?
3. If there is one central office, what are the exact responsibilities of that
   office?
4. Which departments mainly receive work after it leaves the central office?
5. Are there any departments that should never receive dispatched
   correspondence?

## Section 5: Day-To-Day Workflow

Please describe the normal day-to-day workflow in the office for handling
correspondence from the time it is received up to the time it is closed.

Questions:

1. What happens first when a letter, email, memo, or other communication is
   received?
2. Who handles it first?
3. What information is usually captured immediately?
4. Who decides whether the item should be reviewed, routed, or acted on
   directly?
5. After review, does work normally go to a department first, to a specific
   officer directly, or both depending on the case?
6. How does follow-up happen?
7. How is completion confirmed?
8. How is final closure decided?

Please also provide one or two practical examples of real correspondence flow in
the office, for example:

- who receives it first
- who reviews it
- who gives instructions
- whether it is sent to a department or directly to an officer
- who follows up
- who confirms completion or closure

## Section 6: Receipt And Registration

1. How are documents or correspondence received today?

Possible options:

- Hand delivery
- Email
- Courier
- Internal memo
- Phone
- System-generated communication
- Other

2. What information must be captured at the point of receipt?
3. Should the system capture:
   - sender name
   - sender office
   - delivered by
   - delivery method
   - date received
   - receiving officer
   - attachments
4. Who is responsible for registration?
5. How should the reference number be generated?
   - Manual
   - System-generated
   - Both, depending on the case
6. If manual or mixed, what reference format is currently used?
7. If system-generated, what format should the system use?
8. Should the system-generated reference be different for different departments
   or document types?

Please provide example reference numbers currently in use.

## Section 7: Review Process

1. Who reviews incoming items?
2. What exactly happens during review?
3. Should review include:
   - instructions
   - priority setting
   - confidentiality setting
   - due date setting
   - assignment decision
4. What priority levels are used in practice?
5. What confidentiality levels are used in practice?
6. Can a document be reviewed multiple times?
7. If yes, under what circumstances?
8. Can review decisions be changed after dispatch?

## Section 8: Dispatch And Routing

1. Who assigns or dispatches correspondence?
2. Is assignment normally to:
   - department only
   - specific officer
   - both
3. Is due date required at dispatch?
4. Should dispatch be recorded separately from assignment?
5. Does the receiving department confirm receipt?
6. Is acknowledgement tracking required?
7. Should the system track exactly when the item moved from one user or
   department to another?
8. Are there cases where a document is sent to more than one department or
   officer?

## Section 9: Action And Feedback

1. What happens after a document is dispatched?
2. Who performs the work?
3. How is feedback submitted today?
   - Written report
   - File upload
   - Comments or notes
   - Physical file movement
   - Email response
   - Other
4. Is feedback mandatory before closure?
5. Can multiple feedback updates exist for one item?
6. Should departments be able to attach files as evidence of action taken?
7. Should the system track progress updates before final completion?

## Section 10: Closure, Completion, And Escalation

1. Who is allowed to close a document or correspondence item?
2. When is an item considered complete?
3. When is an item considered closed?
4. Can items be cancelled?
5. Can items be reopened after closure?
6. Is closure approval required?
7. Are there escalation rules for overdue or urgent items?
8. Who is notified when an item is overdue, delayed, or pending too long?

## Section 11: Document Registry And Records Management

1. Do you need to track physical documents as well as correspondence?
2. Should the system track:
   - current holder
   - current location
   - archive status
   - file attachments
   - linked correspondence
3. Can a document exist in the system even when it is not tied to a
   correspondence item?
4. Should there be document categories?
5. If yes, what document categories are needed?
6. Should archived documents remain searchable?
7. Are there any legal or records-management requirements for archive handling?

## Section 12: Meetings And Action Points

1. Do meetings generate follow-up tasks?
2. Should the system capture:
   - agenda
   - resolutions
   - action points
   - due dates
   - participants
   - venue
3. Action points should be assigned to:
   - department
   - user
   - both
4. Are deadlines required for action points?
5. Who updates action point status?
6. Should action points be linked back to correspondence where relevant?

## Section 13: Dashboard, Reports, And Alerts

1. What should the dashboard show?
2. Which of the following are required:
   - total correspondence
   - pending items
   - overdue items
   - department performance
   - trends over time
   - average response time
   - SLA tracking
   - urgent alerts
   - pending dispatches
   - pending action points
3. Which reports should be exportable?
4. Do you need printable summaries?
5. Which users or roles should see dashboards and reports?

## Section 14: Current Excel Or Manual System

1. What fields are currently captured in Excel or other manual tools?
2. Which sheets, trackers, or registers are currently used?
3. What problems exist in the current system?

Examples:

- duplicate entries
- lost documents
- no tracking
- delays
- no accountability
- difficulty reporting
- missing handover history

4. Which parts of the current Excel process must definitely be preserved?
5. Which parts of the current Excel process should be replaced or improved?

## Section 15: Pain Points And Must-Have Improvements

1. What are the biggest challenges today?
2. Where do delays happen most often?
3. What causes items to get lost, delayed, or untracked?
4. What must the new system improve immediately?
5. What must never happen again once the system is in place?

## Section 16: Sample Scenarios

Please provide at least two real examples:

### Example 1: Normal correspondence flow

- how it is received
- who registers it
- who reviews it
- who assigns it
- who acts on it
- how feedback is returned
- who closes it

### Example 2: Special or exceptional case

- urgent matter
- confidential item
- direct senior management handling
- multi-department routing
- any other non-standard flow

## Section 17: Final Business Decisions To Confirm

Please confirm the final preferred answers for these items:

1. Final department structure
2. Final role structure
3. Whether one person may hold multiple roles
4. Whether there is one central office department
5. How reference numbers should work
6. Whether dispatch is separate from assignment
7. Whether feedback is mandatory
8. Whether closure approval is required
9. What dashboard and reporting outputs are required

## Completion Note

Once this questionnaire is answered, the answers should be used to:

- refine the role matrix
- refine department structure
- adjust workflow rules
- adjust dashboard and report design
- define the final implementation roadmap

This document is intended to be the main business clarification input before the
next round of system refactoring.
