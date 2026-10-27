# D5 — API Contract Specification (OpenAPI 3.1)
## Bright Solutions: Clinical Hospital Operating System

> **Document ID:** D5  
> **Version:** 1.0  
> **Status:** APPROVED ARCHITECTURE SPECIFICATION  
> **Depends On:** [01_PRD.md](file:///home/prem/Desktop/pbt/COS/docs/design/01_PRD.md), [02_feature_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/02_feature_spec.md), [09_database_schema_ddl.sql](file:///home/prem/Desktop/pbt/COS/docs/design/09_database_schema_ddl.sql), [11_api_endpoint_inventory.md](file:///home/prem/Desktop/pbt/COS/docs/design/11_api_endpoint_inventory.md), [13_rbac_permission_matrix.md](file:///home/prem/Desktop/pbt/COS/docs/design/13_rbac_permission_matrix.md), [03_technical_architecture.md](file:///home/prem/Desktop/pbt/COS/docs/design/03_technical_architecture.md), [04_data_model_spec.md](file:///home/prem/Desktop/pbt/COS/docs/design/04_data_model_spec.md)  
> **Prepared By:** Bright Solutions Backend Engineering Team  
> **Last Updated:** October 2026  

---

## Table of Contents

1. [Specification Overview & Server Topology](#1-specification-overview--server-topology)
2. [Global Envelopes & Pagination Schemas](#2-global-envelopes--pagination-schemas)
3. [Authentication & Security Schemes](#3-authentication--security-schemes)
4. [Standardized Error Codes & Fault Models](#4-standardized-error-codes--fault-models)
5. [Core Domain Schemas (Pydantic v2 / JSON Schema)](#5-core-domain-schemas-pydantic-v2--json-schema)
6. [OpenAPI 3.1 YAML Core Contract](#6-openapi-31-yaml-core-contract)
7. [Frontend Type Generation & Mocking Workflow](#7-frontend-type-generation--mocking-workflow)

---

## 1. Specification Overview & Server Topology

This document formally specifies the **OpenAPI 3.1** contract for the Bright Solutions Hospital Operating System. It defines the JSON schemas, payload envelopes, error models, and endpoint contracts that both the backend FastAPI service and the frontend client adhere to.

### 1.1 Target Server Topologies

```yaml
servers:
  - url: https://clinicalservices.paperbirdtech.com/api/v1
    description: Staging Environment (Contabo LAMP / Apache Reverse Proxy)
  - url: http://localhost:8000/api/v1
    description: Local Development Server
  - url: http://hospital-server.lan:8000/api/v1
    description: Production On-Premise Hospital LAN Server
```

---

## 2. Global Envelopes & Pagination Schemas

Every JSON response returned by Bright Solutions conforms strictly to one of two envelopes: **SuccessEnvelope** or **ErrorEnvelope**.

### 2.1 Success Response Envelope (`SuccessEnvelope<T>`)

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 104,
    "total_pages": 6,
    "has_next": true,
    "has_prev": false
  }
}
```

#### Schema Definition (OpenAPI 3.1 / JSON Schema)
```yaml
components:
  schemas:
    PaginationMeta:
      type: object
      required: [page, limit, total_records, total_pages, has_next, has_prev]
      properties:
        page:
          type: integer
          example: 1
        limit:
          type: integer
          example: 20
        total_records:
          type: integer
          example: 104
        total_pages:
          type: integer
          example: 6
        has_next:
          type: boolean
          example: true
        has_prev:
          type: boolean
          example: false

    SuccessEnvelope:
      type: object
      required: [success, data]
      properties:
        success:
          type: boolean
          const: true
        data:
          description: Dynamic payload object or array
        message:
          type: string
          example: "Operation completed successfully"
        meta:
          $ref: '#/components/schemas/PaginationMeta'
```

---

## 3. Authentication & Security Schemes

Bright Solutions uses standard HTTP Bearer JWT tokens.

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        Authenticate by passing a valid JWT access token:
        `Authorization: Bearer <access_token>`
```

### 3.1 Auth Payload Schemas

#### Request: `LoginRequest`
```json
{
  "username": "dr_roy",
  "password": "SecurePassword123!"
}
```

#### Response: `TokenResponse`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in_seconds": 900,
  "refresh_token": "d7a8b3c2e1f4...",
  "user": {
    "public_id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    "username": "dr_roy",
    "full_name": "Dr. Ananya Roy",
    "role": "DOCTOR",
    "permissions": [
      "consultation:write",
      "consultation:sign",
      "rx:write",
      "lab:order_create",
      "cdss:evaluate"
    ]
  }
}
```

---

## 4. Standardized Error Codes & Fault Models

When a request fails, the API responds with a standard HTTP status code and an **ErrorEnvelope** containing machine-readable error codes and specific field validation errors.

### 4.1 Error Response Envelope (`ErrorEnvelope`)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed on one or more fields",
    "details": [
      {
        "field": "phone",
        "message": "Phone number must be a valid 10-digit Indian mobile number",
        "invalid_value": "12345"
      }
    ]
  }
}
```

### 4.2 Standard Error Codes Catalog

| HTTP Status | Error Code | Description / Trigger Condition |
|:---:|:---|:---|
| **400** | `ENCOUNTER_ALREADY_SIGNED` | Attempted to modify or delete a consultation note that has already been signed |
| **400** | `CANNOT_DISCHARGE` | Inpatient discharge blocked due to unverified summary or unpaid balance |
| **400** | `UNJUSTIFIED_CONTRAINDICATION`| Prescribed drug has a contraindicated interaction without written doctor justification |
| **401** | `UNAUTHORIZED` | Missing or malformed `Authorization: Bearer <token>` header |
| **401** | `TOKEN_EXPIRED` | JWT access token has expired (client must invoke `/auth/refresh`) |
| **401** | `INVALID_CREDENTIALS` | Incorrect username or password |
| **403** | `FORBIDDEN` | Staff role lacks required permission code for requested resource |
| **404** | `PATIENT_NOT_FOUND` | No patient exists with specified public UUID or UHID |
| **404** | `DOCTOR_NOT_FOUND` | No doctor profile exists with specified UUID |
| **404** | `BED_NOT_FOUND` | Specified bed UUID does not exist |
| **409** | `DUPLICATE_PATIENT` | A patient with the same Aadhaar hash or phone number is already registered |
| **409** | `BED_NOT_AVAILABLE` | Selected bed is currently occupied, under maintenance, or cleaning |
| **409** | `INSUFFICIENT_STOCK` | Pharmacy batch does not have enough un-dispensed units to fulfill order |
| **422** | `VALIDATION_ERROR` | Request payload failed Pydantic schema validation |
| **500** | `INTERNAL_SERVER_ERROR` | Unhandled server exception (logged with correlation ID) |

---

## 5. Core Domain Schemas (Pydantic v2 / JSON Schema)

### 5.1 Patient Registration Schemas

```yaml
components:
  schemas:
    PatientCreateRequest:
      type: object
      required: [first_name, last_name, dob, gender, phone, address_line1, city, state, postal_code]
      properties:
        first_name:
          type: string
          minLength: 1
          maxLength: 100
          example: "Ramesh"
        middle_name:
          type: string
          maxLength: 100
          nullable: true
          example: "Kumar"
        last_name:
          type: string
          minLength: 1
          maxLength: 100
          example: "Sharma"
        dob:
          type: string
          format: date
          example: "1985-06-15"
        gender:
          type: string
          enum: [MALE, FEMALE, OTHER]
          example: "MALE"
        blood_group:
          type: string
          enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"]
          default: "UNKNOWN"
          example: "B+"
        phone:
          type: string
          pattern: "^[6-9]\\d{9}$"
          example: "9876543210"
        email:
          type: string
          format: email
          nullable: true
          example: "ramesh@example.com"
        address_line1:
          type: string
          example: "Flat 402, Shanti Heights"
        city:
          type: string
          example: "Mumbai"
        state:
          type: string
          example: "Maharashtra"
        postal_code:
          type: string
          pattern: "^\\d{6}$"
          example: "400001"
        aadhaar_number:
          type: string
          pattern: "^\\d{12}$"
          nullable: true
          example: "123456789012"
        abha_number:
          type: string
          nullable: true
          example: "14-1234-5678-9012"
        emergency_contact_name:
          type: string
          nullable: true
          example: "Sunita Sharma"
        emergency_contact_phone:
          type: string
          pattern: "^[6-9]\\d{9}$"
          nullable: true
          example: "9876543219"

    PatientResponse:
      type: object
      required: [public_id, uhid, full_name, dob, gender, phone, is_active, created_at]
      properties:
        public_id:
          type: string
          format: uuid
        uhid:
          type: string
          example: "BS-001042"
        full_name:
          type: string
          example: "Ramesh Kumar Sharma"
        dob:
          type: string
          format: date
        gender:
          type: string
          enum: [MALE, FEMALE, OTHER]
        blood_group:
          type: string
        phone:
          type: string
        city:
          type: string
        state:
          type: string
        abha_number:
          type: string
          nullable: true
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
```

### 5.2 OPD Queue & Token Schemas

```yaml
    OPDCheckInRequest:
      type: object
      required: [patient_uuid, doctor_uuid]
      properties:
        patient_uuid:
          type: string
          format: uuid
        doctor_uuid:
          type: string
          format: uuid
        visit_type:
          type: string
          enum: [NEW, FOLLOW_UP, EMERGENCY]
          default: NEW
        department:
          type: string
          default: "General Medicine"
        collect_consultation_fee_now:
          type: boolean
          default: true
        payment_method:
          type: string
          enum: [CASH, UPI, CARD, NET_BANKING]
          default: CASH

    OPDCheckInResponse:
      type: object
      required: [visit_uuid, opd_number, uhid, patient_name, doctor_name, token_number, token_status, consultation_fee]
      properties:
        visit_uuid:
          type: string
          format: uuid
        opd_number:
          type: string
          example: "OPD-004521"
        uhid:
          type: string
          example: "BS-001042"
        patient_name:
          type: string
          example: "Ramesh Kumar Sharma"
        doctor_name:
          type: string
          example: "Dr. Ananya Roy"
        token_number:
          type: integer
          example: 14
        token_status:
          type: string
          example: "WAITING"
        consultation_fee:
          type: number
          format: double
          example: 500.00
        invoice_number:
          type: string
          nullable: true
          example: "INV-OPD-000382"
```

### 5.3 Vitals & Triage Schemas

```yaml
    VitalsCreateRequest:
      type: object
      required: [patient_uuid]
      properties:
        patient_uuid:
          type: string
          format: uuid
        opd_visit_uuid:
          type: string
          format: uuid
          nullable: true
        ipd_admission_uuid:
          type: string
          format: uuid
          nullable: true
        temperature_f:
          type: number
          format: float
          minimum: 90.0
          maximum: 110.0
          example: 102.4
        pulse_bpm:
          type: integer
          minimum: 30
          maximum: 250
          example: 110
        blood_pressure_systolic:
          type: integer
          minimum: 50
          maximum: 300
          example: 145
        blood_pressure_diastolic:
          type: integer
          minimum: 30
          maximum: 200
          example: 95
        respiratory_rate_bpm:
          type: integer
          minimum: 5
          maximum: 60
          example: 22
        spo2_percentage:
          type: integer
          minimum: 50
          maximum: 100
          example: 94
        height_cm:
          type: number
          format: float
          minimum: 30.0
          maximum: 250.0
          example: 172.0
        weight_kg:
          type: number
          format: float
          minimum: 1.0
          maximum: 300.0
          example: 76.5
        pain_scale:
          type: integer
          minimum: 0
          maximum: 10
          example: 4

    VitalsResponse:
      type: object
      required: [public_id, bmi, is_abnormal, recorded_at]
      properties:
        public_id:
          type: string
          format: uuid
        bmi:
          type: number
          format: float
          example: 25.9
        is_abnormal:
          type: boolean
          example: true
        abnormal_flags:
          type: array
          items:
            type: string
          example: ["High Temperature (102.4°F)", "Tachycardia (110 bpm)", "Stage 2 Hypertension (145/95 mmHg)"]
        recorded_at:
          type: string
          format: date-time
```

### 5.4 E-Prescription & Pharmacy Schemas

```yaml
    PrescriptionItemCreate:
      type: object
      required: [dosage, frequency, duration_days, quantity_prescribed]
      properties:
        item_uuid:
          type: string
          format: uuid
          nullable: true
          description: "UUID of formulary drug. Null if off-formulary custom item."
        drug_name_custom:
          type: string
          description: "Required if item_uuid is null."
          example: "Paracetamol 650mg"
        dosage:
          type: string
          example: "650 mg"
        frequency:
          type: string
          enum: [OD, BD, TID, QID, PRN, STAT, OTHER]
          example: "TID"
        route:
          type: string
          enum: [ORAL, IV, IM, SC, TOPICAL, INHALATION, OTHER]
          default: "ORAL"
        duration_days:
          type: integer
          minimum: 1
          example: 5
        quantity_prescribed:
          type: integer
          minimum: 1
          example: 15
        food_relation:
          type: string
          enum: [BEFORE_FOOD, AFTER_FOOD, WITH_FOOD, EMPTY_STOMACH, NO_RELATION]
          default: "AFTER_FOOD"
        special_instructions:
          type: string
          nullable: true
          example: "Take if temperature exceeds 100°F"
        is_off_formulary:
          type: boolean
          default: false
        off_formulary_reason:
          type: string
          nullable: true

    PrescriptionCreateRequest:
      type: object
      required: [patient_uuid, consultation_uuid, items]
      properties:
        patient_uuid:
          type: string
          format: uuid
        consultation_uuid:
          type: string
          format: uuid
        general_instructions:
          type: string
          nullable: true
          example: "Drink plenty of warm liquids."
        contraindication_override_reason:
          type: string
          nullable: true
          description: "Mandatory if CDSS detects CONTRAINDICATED drug pair."
        items:
          type: array
          items:
            $ref: '#/components/schemas/PrescriptionItemCreate'
```

### 5.5 IPD Admission & Bed Schemas

```yaml
    IPDAdmissionRequest:
      type: object
      required: [patient_uuid, attending_doctor_uuid, bed_uuid, provisional_diagnosis]
      properties:
        patient_uuid:
          type: string
          format: uuid
        attending_doctor_uuid:
          type: string
          format: uuid
        bed_uuid:
          type: string
          format: uuid
        admission_type:
          type: string
          enum: [ELECTIVE, EMERGENCY, TRANSFER]
          default: "ELECTIVE"
        provisional_diagnosis:
          type: string
          example: "Dengue with severe thrombocytopenia"
        advance_amount:
          type: number
          format: double
          minimum: 0.00
          default: 0.00
          example: 5000.00
        payment_method:
          type: string
          enum: [CASH, UPI, CARD, NET_BANKING]
          default: "CASH"
        transaction_reference:
          type: string
          nullable: true
```

### 5.6 Billing & Multi-Point Payment Schemas

```yaml
    PaymentCreateRequest:
      type: object
      required: [amount, payment_method]
      properties:
        amount:
          type: number
          format: double
          minimum: 1.00
          example: 7350.00
        payment_method:
          type: string
          enum: [CASH, UPI, CARD, NET_BANKING, CHEQUE]
          example: "UPI"
        transaction_reference:
          type: string
          nullable: true
          example: "UPI/239049203940"
        notes:
          type: string
          nullable: true
          example: "Discharge final settlement"

    InvoiceResponse:
      type: object
      required: [public_id, invoice_number, invoice_type, status, subtotal_amount, discount_amount, tax_amount, net_amount, paid_amount, balance_amount, generated_at]
      properties:
        public_id:
          type: string
          format: uuid
        invoice_number:
          type: string
          example: "INV-IPD-000052"
        invoice_type:
          type: string
          enum: [OPD_CONSULTATION, PHARMACY, LAB, IPD_FINAL]
        status:
          type: string
          enum: [DRAFT, UNPAID, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED]
        subtotal_amount:
          type: number
          format: double
          example: 12350.00
        discount_amount:
          type: number
          format: double
          example: 0.00
        tax_amount:
          type: number
          format: double
          example: 0.00
        net_amount:
          type: number
          format: double
          example: 12350.00
        paid_amount:
          type: number
          format: double
          example: 12350.00
        balance_amount:
          type: number
          format: double
          example: 0.00
        generated_at:
          type: string
          format: date-time
```

---

## 6. OpenAPI 3.1 YAML Core Contract

Below is the OpenAPI 3.1 YAML specification defining the primary endpoint paths and bindings:

```yaml
openapi: 3.1.0
info:
  title: Bright Solutions Clinical Hospital Operating System API
  version: 1.0.0
  description: |
    Production REST API specifications for Bright Solutions Hospital OS.
    Covers Patient Management, OPD Queues, Clinical Consultations, E-Prescribing,
    Inpatient Admissions, Pathology, Multi-Point Billing, and CDSS Safety.
  contact:
    name: Bright Solutions Engineering Team
    email: dev@paperbirdtech.com

paths:
  # ==========================================================================
  # PATIENT REGISTRATION
  # ==========================================================================
  /patients:
    post:
      summary: Register new patient and issue UHID
      operationId: registerPatient
      tags: [Patients]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatientCreateRequest'
      responses:
        '201':
          description: Patient successfully registered
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessEnvelope'
                  - properties:
                      data:
                        $ref: '#/components/schemas/PatientResponse'
        '409':
          description: Duplicate Aadhaar hash or phone collision
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorEnvelope'
        '422':
          description: Validation error

    get:
      summary: Search and list patient directory
      operationId: searchPatients
      tags: [Patients]
      security:
        - BearerAuth: []
      parameters:
        - name: query
          in: query
          description: Search term (UHID, phone, or name)
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated patient results
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessEnvelope'
                  - properties:
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/PatientResponse'

  # ==========================================================================
  # OPD QUEUE MANAGEMENT
  # ==========================================================================
  /opd/visits:
    post:
      summary: Check-in patient, generate OPD# and issue queue token
      operationId: checkInOPDVisit
      tags: [OPD Queue]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OPDCheckInRequest'
      responses:
        '201':
          description: Check-in completed and token issued
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessEnvelope'
                  - properties:
                      data:
                        $ref: '#/components/schemas/OPDCheckInResponse'

  # ==========================================================================
  # CLINICAL DECISION SUPPORT SYSTEM (CDSS)
  # ==========================================================================
  /cdss/check-ddi:
    post:
      summary: Evaluate drug-drug interaction safety for medication pairs
      operationId: checkDrugDrugInteractions
      tags: [CDSS]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [drug_generics]
              properties:
                drug_generics:
                  type: array
                  items:
                    type: string
                  example: ["Warfarin", "Aspirin", "Paracetamol"]
      responses:
        '200':
          description: Interaction evaluation results
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessEnvelope'
                  - properties:
                      data:
                        type: object
                        required: [has_interactions, interactions]
                        properties:
                          has_interactions:
                            type: boolean
                          interactions:
                            type: array
                            items:
                              type: object
                              properties:
                                drug_a:
                                  type: string
                                drug_b:
                                  type: string
                                severity:
                                  type: string
                                  enum: [CONTRAINDICATED, MAJOR, MODERATE, MINOR]
                                clinical_mechanism:
                                  type: string
                                management_advice:
                                  type: string

  # ==========================================================================
  # WAITING ROOM DISPLAY (PUBLIC)
  # ==========================================================================
  /display/queue:
    get:
      summary: Fetch privacy-safe waiting room queue snapshot for smart TVs
      operationId: getPublicDisplayQueue
      tags: [Public Display]
      security: []
      responses:
        '200':
          description: Real-time waiting room tokens without patient names
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/SuccessEnvelope'
                  - properties:
                      data:
                        type: object
                        properties:
                          hospital_name:
                            type: string
                          current_time:
                            type: string
                            format: date-time
                          doctors:
                            type: array
                            items:
                              type: object
                              properties:
                                doctor_name:
                                  type: string
                                specialization:
                                  type: string
                                room_number:
                                  type: string
                                currently_calling_token:
                                  type: integer
                                  nullable: true
                                waiting_tokens:
                                  type: array
                                  items:
                                    type: integer
                                status:
                                  type: string
```

---

## 7. Frontend Type Generation & Mocking Workflow

The Frontend Lead and frontend junior developers can generate 100% type-safe TypeScript interfaces directly from this specification or the running FastAPI `/openapi.json` route.

### 7.1 Automated TypeScript Generation

Using `openapi-typescript`:

```bash
# Generate TypeScript types from backend OpenAPI JSON
npx openapi-typescript http://localhost:8000/api/v1/openapi.json --output src/types/api.generated.ts
```

### 7.2 Frontend Consumption Example in React

```typescript
// src/services/patientService.ts
import { paths } from '@/types/api.generated';

type PatientCreateBody = paths['/patients']['post']['requestBody']['content']['application/json'];
type PatientCreateResponse = paths['/patients']['post']['responses']['201']['content']['application/json'];

export async function registerPatient(payload: PatientCreateBody): Promise<PatientCreateResponse> {
  const response = await fetch('/api/v1/patients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to register patient');
  }
  
  return response.json();
}
```
