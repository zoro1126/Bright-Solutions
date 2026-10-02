# 04 — User Stories
## CancerCare OS (COS) — Oncology Hospital Information System

---

## Epic 1: Patient Onboarding (Receptionist)

| ID | As a... | I want to... | So that... | Priority | Status |
|---|---|---|---|---|---|
| US-001 | Receptionist | Register a new patient with demographic details | The patient has a unique medical record and can be tracked across all dashboards | 🔴 High | To Do |
| US-002 | Receptionist | Search for an existing patient by name or phone number | I can pull up a returning patient without creating a duplicate | 🔴 High | To Do |
| US-003 | Receptionist | Enter the patient's insurance provider, policy number, and coverage details | The Cashier can auto-calculate the patient's liability without asking again | 🔴 High | To Do |
| US-004 | Receptionist | Select "No Insurance / Cash Pay" for uninsured patients | The billing flow handles cash patients correctly without requiring insurance fields | 🔴 High | To Do |
| US-005 | Receptionist | Fill in a guided, multi-step oncology intake questionnaire for the patient | Structured clinical history is captured systematically and fed into the AI pipeline | 🔴 High | To Do |
| US-006 | Receptionist | Save a partially completed questionnaire as a draft | I can continue data entry if the patient needs a break or I'm interrupted | 🟡 Medium | To Do |
| US-007 | Receptionist | Submit the completed questionnaire and see a confirmation | I know the ML insight generation has been triggered and can expect results | 🔴 High | To Do |
| US-008 | Receptionist | See the visit status change to "Insights Ready" on my screen | I know when the doctor can begin the consultation | 🟡 Medium | To Do |

---

## Epic 2: ML Insight Generation (System / Backend)

| ID | As a... | I want to... | So that... | Priority | Status |
|---|---|---|---|---|---|
| US-009 | System | Automatically enqueue a questionnaire processing job when submission is received | Insight generation begins without any manual trigger | 🔴 High | To Do |
| US-010 | System | Run ML risk classification on the questionnaire responses | Oncologists receive structured cancer risk flags with severity levels | 🔴 High | To Do |
| US-011 | System | Generate a plain-language patient summary from questionnaire data | The oncologist can read a short narrative instead of scanning raw form responses | 🔴 High | To Do |
| US-012 | System | Detect potential medication interactions from the medications list | The oncologist is alerted before prescribing conflicting drugs | 🟡 Medium | To Do |
| US-013 | System | Push a real-time "Insights Ready" notification to the Doctor dashboard | The doctor knows immediately when AI analysis is complete, without refreshing | 🔴 High | To Do |

---

## Epic 3: Oncologist — Patient Consultation (Doctor)

| ID | As a... | I want to... | So that... | Priority | Status |
|---|---|---|---|---|---|
| US-014 | Doctor | See a live patient queue showing today's appointments and their status | I can manage my patient flow and know who is ready for consultation | 🔴 High | To Do |
| US-015 | Doctor | Open a patient's record and see a structured history summary | I don't have to ask the patient to repeat their history from scratch | 🔴 High | To Do |
| US-016 | Doctor | View the AI-generated ML insights including risk flags, symptom summary, and medication warnings | I can identify key clinical signals in seconds rather than reading raw questionnaire data | 🔴 High | To Do |
| US-017 | Doctor | Annotate, accept, or dismiss individual ML insights | I remain in clinical control and can flag incorrect AI outputs for model improvement | 🟡 Medium | To Do |
| US-018 | Doctor | View DICOM scan series (CT, MRI, PET) for the patient in an integrated viewer | I don't need to switch to an external PACS workstation mid-consultation | 🔴 High | To Do |
| US-019 | Doctor | Use DICOM tools (zoom, pan, windowing, measure) to analyse scans | I can perform routine radiological review without leaving the consultation workspace | 🔴 High | To Do |
| US-020 | Doctor | Create a prescription with drug name, dose, frequency, and duration | A structured, legible prescription is generated and attached to the patient record | 🔴 High | To Do |
| US-021 | Doctor | Write and edit a patient conclusion letter in a rich-text editor, pre-filled with AI suggestions | I can produce a professional, personalised consultation summary in a fraction of the usual time | 🔴 High | To Do |
| US-022 | Doctor | Finalise and lock the conclusion document with my digital signature | The document is legally attributed to me and triggers the billing workflow | 🔴 High | To Do |
| US-023 | Doctor | Export the conclusion and prescription as PDFs | The patient receives printable, professional documents at the end of the visit | 🟡 Medium | To Do |

---

## Epic 4: Billing & Checkout (Cashier)

| ID | As a... | I want to... | So that... | Priority | Status |
|---|---|---|---|---|---|
| US-024 | Cashier | See a notification when a doctor finalises a patient's conclusion | I know the patient is ready for checkout without calling the doctor | 🔴 High | To Do |
| US-025 | Cashier | View an auto-populated bill with consultation fee, investigations, and medications | I don't have to manually reconstruct what services were rendered | 🔴 High | To Do |
| US-026 | Cashier | Toggle between Insurance and Cash billing views for the same patient | The correct financial calculation is applied based on the patient's coverage | 🔴 High | To Do |
| US-027 | Cashier | See a clear breakdown of insurance-covered amount vs. patient out-of-pocket liability | The patient knows exactly what they owe, reducing disputes | 🔴 High | To Do |
| US-028 | Cashier | Add or remove line items from the bill before finalising | I can handle edge cases (e.g., waived fees, additional charges) without workarounds | 🟡 Medium | To Do |
| US-029 | Cashier | Mark a bill as Paid and generate a receipt PDF | The transaction is recorded and the patient receives proof of payment | 🔴 High | To Do |
| US-030 | Cashier | View the complete billing history for a patient across visits | I can resolve disputes or reprint receipts for past visits | 🟡 Medium | To Do |

---

## Epic 5: Cross-Dashboard Data Consistency (System)

| ID | As a... | I want to... | So that... | Priority | Status |
|---|---|---|---|---|---|
| US-031 | Doctor | See patient status updates from the Receptionist in real-time | I always know which patients are ready without phoning reception | 🔴 High | To Do |
| US-032 | Cashier | Receive instant notification when the doctor finalises a conclusion | There is no delay in the billing workflow and patient wait time is minimised | 🔴 High | To Do |
| US-033 | Receptionist | See when the doctor has completed the consultation for a patient | I can inform the patient to proceed to the cashier | 🟡 Medium | To Do |
| US-034 | All Roles | Have my session expire after inactivity and be prompted to re-authenticate | Patient data is protected if a workstation is left unattended | 🔴 High | To Do |
