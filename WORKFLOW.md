# PMed-Aid Hospital Management System - Complete Workflow Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles](#user-roles)

3. [Phase 1: Patient Registration (Info Desk)](#phase-1-patient-registration-info-desk)

4. [Phase 2: Consultation (Doctor)]
(#phase-2-consultation-doctor)

5. [Phase 3: Admission Decision (Doctor)](#phase-3-admission-decision-doctor)

6. [Phase 4: Room Assignment (Info Desk)](#phase-4-room-assignment-info-desk)

7. [Phase 5: Patient Care (Nurse & Doctor)](#phase-5-patient-care-nurse--doctor)

8. [Phase 6: Prescription Management (Pharmacy)](#phase-6-prescription-management-pharmacy)

9. [Phase 7: Discharge Process (Doctor & Info Desk)](#phase-7-discharge-process-doctor--info-desk)

10. [Phase 8: Patient Home Care (Patient)](#phase-8-patient-home-care-patient)

11. [Data Flow Diagrams](#data-flow-diagrams)
12. [API Endpoints Used](#api-endpoints-used)

---

## System Overview

**PMed-Aid** is a comprehensive hospital management system designed to streamline patient care from registration through discharge. The system tracks:
- Patient information and medical history
- Doctor-patient consultations
- Room admissions and assignments
- Medication prescriptions and adherence
- Discharge documentation
- Post-discharge patient monitoring

**Key Technologies:**
- Mobile App (React Native) - Info Desk, Doctor, Nurse, Patient, Pharmacy, Admin
- Web Interface (React) - Info Desk, Doctor, Admin
- Backend API (Node.js/Express)
- Database (MySQL/Sequelize ORM)

---

## User Roles

| Role | Responsibilities | Key Features |
|------|-----------------|--------------|
| **Info Desk** | Register patients, queue consultations, process admissions, finalize discharge | Search patients, register new, assign rooms, generate discharge docs |
| **Doctor** | Consult patients, diagnose, request admission, write prescriptions, approve discharge | View consultations, patient records, write prescriptions, request discharge |
| **Nurse** | Administer medications, monitor vitals, care for admitted patients | View assigned patients, record medication administration, monitor schedules |
| **Pharmacy** | Manage prescriptions, dispense medications, verify doctor orders | View prescriptions, manage medication inventory |
| **Patient** | Receive care, take medications, monitor adherence | View prescriptions, medication schedule, scan QR code for reminders |
| **Admin** | System management, user management, analytics, reports | Manage users, view dashboard, system settings |

---

## PHASE 1: Patient Registration (Info Desk)

### **Scenario Setup**
```
Time: 8:00 AM
Location: Hospital Reception (Info Desk)
Patient: Juan Dela Cruz, 58 years old, complaining of chest pain
Info Desk Staff: Maria
```

### **Step 1.1: Patient Arrives**
```
ACTION: Patient walks into hospital with symptoms
INFO DESK (Maria):
  - Greets patient
  - Takes basic complaint information
  - Decides to register patient in system
```

### **Step 1.2: Info Desk Opens Mobile App**
```
SCREEN: Main Dashboard
TAP: "Admission Management"
```

### **Step 1.3: Queue New Patient**
```
SCREEN: Admission Management
TAB: "Consultation Queue"
TAP: "Queue Patient" button

MODAL OPENS: Search/Create Patient
  - If existing patient: Select from search results
  - If new patient: Type name to create
```

### **Step 1.4: Create New Patient**
```
SCREEN: Register New Patient Modal
FORM FIELDS:

📋 PERSONAL INFORMATION
  ├─ First Name *
  │  └─ Input: "Juan"
  │     Validation: Required, text only
  │
  ├─ Last Name *
  │  └─ Input: "Dela Cruz"
  │     Validation: Required, text only
  │
  ├─ Date of Birth
  │  └─ Input: "01151965" (user types)
  │     Display: "01/15/1965" (auto-formatted)
  │     Format: MM/DD/YYYY
  │     Validation: Month ≤ 12, Day ≤ 31
  │
  └─ Gender *
     └─ Dropdown: [Male / Female]
        Selection: "Male"
        Validation: Required

📋 CONTACT DETAILS
  ├─ Civil Status
  │  └─ Dropdown: [Single / Married / Divorced / Widowed]
  │     Selection: "Married"
  │
  ├─ Contact Number
  │  └─ Input: "09171234567"
  │     Format: Any format accepted
  │
  ├─ Address
  │  └─ Input: "123 Main Street, Metro City, Rizal"
  │
  ├─ Emergency Contact Name
  │  └─ Input: "Maria Dela Cruz"
  │
  └─ Emergency Contact Number
     └─ Input: "09171234566"

📋 MEDICAL INFORMATION
  ├─ Blood Type
  │  └─ Dropdown: [A+ / A- / B+ / B- / AB+ / AB- / O+ / O-]
  │     Selection: "O+"
  │
  └─ Allergies
     └─ Text Area: "Penicillin, Shellfish, Latex"
```

### **Step 1.5: Form Validation**
```
CLIENT-SIDE VALIDATION:
  ✓ First Name: Not empty
  ✓ Last Name: Not empty
  ✓ Gender: Selected
  ✓ Date: Valid MM/DD/YYYY format

ACTION: TAP "Continue to Doctor Assignment"
```

### **Step 1.6: Assign Consultation Doctor**
```
SCREEN: Assign Doctor Modal
FORM FIELDS:

  ├─ Patient
  │  └─ Display: "Juan Dela Cruz" ✓ (auto-filled)
  │
  ├─ Doctor *
  │  └─ Dropdown: [Dr. Reyes / Dr. Santos / Dr. Cruz / ...]
  │     Selection: "Dr. Reyes"
  │     API Call: GET /users?role=doctor
  │
  ├─ Scheduled Time (Optional)
  │  └─ Date/Time Picker (leave empty for immediate)
  │
  └─ Notes (Optional)
     └─ Text Area: "Patient complains of chest pain, shortness of breath"
```

### **Step 1.7: Create Consultation**
```
ACTION: TAP "Queue Patient"

SYSTEM ACTIONS:
  1. Validate form inputs
  2. POST /patients (Register new patient)
     PAYLOAD:
     {
       "first_name": "Juan",
       "last_name": "Dela Cruz",
       "date_of_birth": "1965-01-15",
       "gender": "male",
       "civil_status": "married",
       "contact_number": "09171234567",
       "address": "123 Main Street",
       "emergency_contact_name": "Maria Dela Cruz",
       "emergency_contact_number": "09171234566",
       "blood_type": "O+",
       "allergies": "Penicillin, Shellfish, Latex"
     }
     RESPONSE:
     {
       "success": true,
       "data": {
         "id": 145,
         "first_name": "Juan",
         "last_name": "Dela Cruz",
         ...
       }
     }
  
  3. POST /consultations (Queue for consultation)
     PAYLOAD:
     {
       "patient_id": 145,
       "doctor_id": 12,
       "scheduled_time": null,
       "notes": "Patient complains of chest pain..."
     }
     RESPONSE:
     {
       "success": true,
       "data": {
         "id": 543,
         "patient_id": 145,
         "doctor_id": 12,
         "status": "waiting",
         "created_at": "2024-09-28T08:00:00Z"
       }
     }
  
  4. Send Notification to Dr. Reyes
     Type: "New consultation queued"
     Message: "Juan Dela Cruz is waiting for consultation"

DISPLAY: Success message "Patient queued for consultation!"
REDIRECT: Back to Admission Management with updated queues
```

### **Step 1.8: Patient Status After Registration**
```
✅ PATIENT RECORD CREATED
   MRN: MRN-00145
   Name: Juan Dela Cruz
   Age: 58 years
   Gender: Male
   Blood Type: O+
   Status: 🟡 WAITING FOR CONSULTATION

✅ CONSULTATION CREATED
   Status: waiting
   Doctor: Dr. Reyes
   Created: 8:00 AM

📱 INFO DESK APP UPDATE
   TAB: "Consultation Queue"
   Shows: "Juan Dela Cruz - Waiting with Dr. Reyes"
```

---

## PHASE 2: Consultation (Doctor)

### **Scenario Setup**
```
Time: 8:15 AM
Location: Consultation Room
Doctor: Dr. Reyes (Mobile App)
Patient: Juan Dela Cruz
```

### **Step 2.1: Doctor Sees Consultation Queue**
```
SCREEN: Doctor Dashboard → Consultations
TAB: "Waiting"

DISPLAY:
  ┌─────────────────────────────┐
  │ Patient: Juan Dela Cruz     │
  │ Queue Status: 🟡 WAITING   │
  │ Queued Since: 8:00 AM       │
  │ Notes: Chest pain complaint │
  │                             │
  │ [TAP TO CONSULT]            │
  └─────────────────────────────┘
```

### **Step 2.2: Doctor Calls Patient In**
```
ACTION: TAP "Juan Dela Cruz"

SCREEN: Patient Record + Consultation Form

DISPLAY PATIENT INFO:
  ├─ Name: Juan Dela Cruz
  ├─ Age: 58 years
  ├─ Gender: Male
  ├─ Blood Type: O+
  ├─ Allergies: Penicillin, Shellfish, Latex
  ├─ Contact: 09171234567
  └─ Medical History: (if any previous records)

CONSULTATION FORM:
  ├─ Chief Complaint: (for doctor to fill)
  ├─ Vital Signs:
  │  ├─ Blood Pressure: _____ mmHg
  │  ├─ Heart Rate: _____ bpm
  │  ├─ Temperature: _____ °C
  │  ├─ Respiratory Rate: _____ /min
  │  └─ Oxygen Saturation: ______ %
  │
  ├─ Physical Examination: (text area)
  ├─ Assessment/Diagnosis: (text area)
  ├─ Treatment Plan: (text area)
  │
  └─ Admission Required?
     └─ Radio Button: [Yes / No]
```

### **Step 2.3: Doctor Records Consultation**
```
DOCTOR ENTERS:
  ├─ Chief Complaint: "Acute chest pain, shortness of breath"
  │
  ├─ Vital Signs:
  │  ├─ Blood Pressure: 160/100 mmHg (HIGH)
  │  ├─ Heart Rate: 95 bpm (Slightly elevated)
  │  ├─ Temperature: 37.5°C (Normal)
  │  ├─ Respiratory Rate: 20 /min (Slightly elevated)
  │  └─ Oxygen Saturation: 96% (Normal)
  │
  ├─ Physical Examination:
  │  └─ "Lungs clear. Heart sounds regular. No murmurs detected.
  │      However, elevated BP and pain on exertion suggests cardiac issue."
  │
  ├─ Assessment/Diagnosis:
  │  └─ "Suspected Acute Coronary Syndrome (ACS)
  │      Differential diagnosis: Angina, possible MI risk
  │      Requires immediate admission for cardiac workup"
  │
  ├─ Treatment Plan:
  │  └─ "1. ECG monitoring
  │      2. Cardiac enzyme tests (Troponin, CK-MB)
  │      3. Chest X-ray
  │      4. Continuous cardiac monitoring
  │      5. Initial medications for pain and BP control"
  │
  └─ Admission Required?: YES ✓
```

### **Step 2.4: Doctor Completes Consultation**
```
ACTION: TAP "Complete Consultation"

SYSTEM ACTIONS:
  1. PUT /consultations/{543} (Update consultation status)
     PAYLOAD:
     {
       "status": "in_session",
       "chief_complaint": "Acute chest pain...",
       "vital_signs": {
         "bp": "160/100",
         "hr": 95,
         "temp": 37.5,
         "rr": 20,
         "o2_sat": 96
       },
       "physical_exam": "Lungs clear...",
       "assessment": "Suspected ACS...",
       "treatment_plan": "ECG monitoring...",
       "admission_required": true
     }
     RESPONSE: Success

  2. Consultation status changes: "waiting" → "in_session"

DISPLAY: Consultation details saved successfully
```

---

## PHASE 3: Admission Decision (Doctor)

### **Step 3.1: Doctor Requests Admission**
```
SCREEN: Same consultation screen

BUTTON APPEARS: "Request Admission" (since admission_required = true)

ACTION: TAP "Request Admission"

MODAL OPENS: Admission Request Form
```

### **Step 3.2: Fill Admission Details**
```
FORM FIELDS:

  ├─ Patient
  │  └─ Display: "Juan Dela Cruz" ✓
  │
  ├─ Department *
  │  └─ Dropdown: [Cardiology / Orthopedics / General / ...]
  │     Selection: "Cardiology"
  │
  ├─ Reason for Admission *
  │  └─ Text Area: "Acute chest pain, suspected ACS
  │                  Requires ECG, cardiac enzymes, monitoring"
  │
  ├─ Expected Duration
  │  └─ Text Area: "3-5 days for initial workup and stabilization"
  │
  ├─ Special Notes
  │  └─ Text Area: "Patient has allergy to Penicillin
  │                  Use alternative antibiotics if needed"
  │
  └─ Treatment Plan
     └─ Text Area: "ECG, Troponin test, CK-MB
                    Aspirin, clopidogrel loading
                    Beta-blocker for BP control
                    Continuous cardiac monitoring"
```

### **Step 3.3: Submit Admission Request**
```
ACTION: TAP "Request Admission"

SYSTEM ACTIONS:
  1. Validate form
  2. PUT /consultations/{543}
     PAYLOAD:
     {
       "status": "admitted",
       "admission_required": true,
       "department": "Cardiology",
       "reason_for_admission": "Acute chest pain...",
       "expected_duration": "3-5 days...",
       "special_notes": "Patient has allergy..."
     }
  
  3. Create admission pending status
  
  4. Send notification to Info Desk
     Type: "Admission Required"
     Message: "Juan Dela Cruz needs admission to Cardiology"

DISPLAY: "Admission request submitted!"
CONSULTATION STATUS: 🔴 PENDING ADMISSION

📱 INFO DESK APP:
   TAB: "Pending Admissions"
   New entry: "Juan Dela Cruz - Cardiology"
```

---

## PHASE 4: Room Assignment (Info Desk)

### **Scenario Setup**
```
Time: 8:45 AM
Location: Info Desk
Staff: Maria
Status: New pending admission notification received
```

### **Step 4.1: Info Desk Reviews Pending Admissions**
```
SCREEN: Admission Management
TAB: "Pending Admissions"

DISPLAY:
  ┌──────────────────────────────┐
  │ 🔴 Juan Dela Cruz            │
  │ Department: Cardiology       │
  │ Status: Awaiting Room        │
  │ Notes: Suspected ACS, needs  │
  │        ECG monitoring        │
  │                              │
  │ [ADMIT PATIENT]              │
  └──────────────────────────────┘
```

### **Step 4.2: Assign Room and Staff**
```
ACTION: TAP "ADMIT PATIENT"

MODAL OPENS: Assign Room

FORM FIELDS:

  ├─ Patient
  │  └─ Display: "Juan Dela Cruz" ✓
  │
  ├─ Department
  │  └─ Display: "Cardiology" ✓
  │
  ├─ Room *
  │  └─ Dropdown: Show available rooms
  │     [API: GET /rooms/available?department=cardiology]
  │     
  │     Available Rooms:
  │     ├─ Room 301 - Double Bed, ECG Monitor ✓
  │     ├─ Room 302 - Double Bed, Oxygen Available
  │     ├─ Room 305 - Private Room (Premium)
  │     └─ Room 307 - ICU (for critical)
  │     
  │     Selection: "Room 301 - Double Bed"
  │
  ├─ Attending Doctor
  │  └─ Display: "Dr. Reyes" ✓ (from consultation)
  │
  ├─ Assigned Nurse *
  │  └─ Dropdown: [Nurse Rosa / Nurse Ana / Nurse Joy / ...]
  │     Selection: "Nurse Rosa"
  │     (Filter: Available nurses in Cardiology)
  │
  ├─ Special Requirements (Optional)
  │  └─ Checkboxes:
  │     ├─ ☑ Continuous ECG Monitoring
  │     ├─ ☑ IV Access Required
  │     ├─ ☐ Oxygen Therapy
  │     └─ ☐ Isolation
  │
  └─ Admission Notes (Optional)
     └─ Text Area: "Patient stable but needs monitoring"
```

### **Step 4.3: Confirm Admission**
```
ACTION: TAP "CONFIRM ADMISSION"

SYSTEM ACTIONS:
  1. POST /admissions
     PAYLOAD:
     {
       "patient_id": 145,
       "room_id": 301,
       "attending_doctor_id": 12,
       "assigned_nurse_id": 25,
       "admission_date": "2024-09-28T08:45:00Z",
       "department": "Cardiology",
       "reason_for_admission": "Acute chest pain, suspected ACS",
       "notes": "Patient stable but needs monitoring",
       "consultation_id": 543
     }
     
     RESPONSE:
     {
       "success": true,
       "data": {
         "id": 87,
         "patient_id": 145,
         "room_id": 301,
         "admission_date": "2024-09-28T08:45:00Z",
         "status": "admitted"
       }
     }
  
  2. Update room status
     PUT /rooms/301
     { "is_occupied": true }
  
  3. Update consultation status
     PUT /consultations/543
     { "status": "admitted", "admission_id": 87 }
  
  4. Generate QR Code for patient
     POST /qr-codes
     {
       "patient_id": 145,
       "admission_id": 87,
       "type": "in_hospital"
     }
  
  5. Create MRN: MRN-00145
  
  6. Send Notifications:
     ✓ To Nurse Rosa: "Juan Dela Cruz assigned to you in Room 301"
     ✓ To Dr. Reyes: "Admission confirmed - Room 301"

DISPLAY: "Patient admitted successfully!"
```

### **Step 4.4: Admission Confirmed**
```
✅ ADMISSION RECORD CREATED
   Admission ID: 87
   MRN: MRN-00145
   Patient: Juan Dela Cruz
   Room: 301
   Department: Cardiology
   Attending Doctor: Dr. Reyes
   Assigned Nurse: Nurse Rosa
   Status: 🟢 ADMITTED
   Admitted At: 8:45 AM

📱 APP UPDATES:
   INFO DESK TAB: "Pending Admissions" → Patient removed
   INFO DESK TAB: "Admitted" → Patient added
   NURSE APP: Gets new assigned patient
   DOCTOR APP: Sees patient now in admitted list
```

---

## PHASE 5: Patient Care (Nurse & Doctor)

### **Scenario Setup**
```
Time: 9:00 AM - Day 3, 10:00 AM
Location: Cardiology Ward (Room 301)
Nurse: Rosa
Doctor: Dr. Reyes
Patient: Juan Dela Cruz (Admitted)
```

### **Step 5.1: Nurse Receives Patient**
```
📱 NURSE APP

SCREEN: Assigned Patients
TAP: "Juan Dela Cruz" (Room 301)

DISPLAY PATIENT INFO:
  ├─ Name: Juan Dela Cruz
  ├─ Age: 58 years
  ├─ MRN: MRN-00145
  ├─ Room: 301
  ├─ Doctor: Dr. Reyes
  ├─ Blood Type: O+
  ├─ Allergies: Penicillin, Shellfish ⚠️
  ├─ Admission Date: 8:45 AM
  ├─ Reason: Suspected ACS
  ├─ Department: Cardiology
  └─ Special Notes: Continuous ECG monitoring

NURSING TASKS:
  ├─ Check vital signs
  ├─ Set up monitoring
  ├─ Administer initial medications
  ├─ Establish IV access
  └─ Document intake
```

### **Step 5.2: Nurse Records Vital Signs**
```
ACTION: TAP "Record Vital Signs"

FORM OPENS:
  ├─ Blood Pressure: 155/98 mmHg
  ├─ Heart Rate: 88 bpm
  ├─ Temperature: 37.2°C
  ├─ Respiratory Rate: 18 /min
  ├─ Oxygen Saturation: 97%
  ├─ Pain Level: 4/10
  ├─ Last Medication: Aspirin 500mg (8:50 AM)
  └─ Notes: "Patient resting, responding well to medication"

ACTION: TAP "Save Vital Signs"

SYSTEM: POST /schedules/{schedule_id}/vitals
  Stores vital signs in patient monitoring record
  Alerts doctor if any values are concerning
```

### **Step 5.3: Doctor Writes Prescription**
```
📱 DOCTOR APP

SCREEN: Patient Records
TAP: "Juan Dela Cruz" (Room 301)

BUTTON: "Write Prescription"

MODAL OPENS: Prescription Form

FORM FIELDS:

  MEDICATION 1:
  ├─ Medicine Name: Aspirin
  ├─ Dosage: 500 mg
  ├─ Frequency: Once daily
  ├─ Duration: 30 days
  ├─ Route: Oral
  └─ Notes: After meals, for cardiac protection
  
  MEDICATION 2:
  ├─ Medicine Name: Atorvastatin
  ├─ Dosage: 20 mg
  ├─ Frequency: Once daily
  ├─ Duration: 90 days
  ├─ Route: Oral
  └─ Notes: At bedtime, cholesterol management
  
  MEDICATION 3:
  ├─ Medicine Name: Metoprolol
  ├─ Dosage: 50 mg
  ├─ Frequency: Twice daily
  ├─ Duration: 60 days
  ├─ Route: Oral
  └─ Notes: BP control, monitor heart rate
  
  MEDICATION 4:
  ├─ Medicine Name: Clopidogrel
  ├─ Dosage: 75 mg
  ├─ Frequency: Once daily
  ├─ Duration: 12 months
  ├─ Route: Oral
  └─ Notes: Antiplatelet therapy
  
  TYPE:
  └─ Selection: ⭕ Hospital (During admission)
                ⭕ Discharge (For home medications)
```

### **Step 5.4: Doctor Submits Prescription**
```
ACTION: TAP "Submit Prescription"

SYSTEM ACTIONS:
  1. POST /prescriptions
     PAYLOAD:
     {
       "patient_id": 145,
       "doctor_id": 12,
       "admission_id": 87,
       "type": "hospital",
       "items": [
         {
           "medication_name": "Aspirin",
           "dosage": "500mg",
           "frequency": "1x daily",
           "duration": 30,
           "route": "oral",
           "instructions": "After meals"
         },
         { ... more medications ... }
       ]
     }
  
  2. Create medication schedule
     POST /medication-schedules
     For each medication, create daily administration records
  
  3. Send notification to Pharmacy
     Type: "New Prescription"
     Message: "Prepare medications for Juan Dela Cruz"
  
  4. Notify Nurse
     Type: "Prescription Ready"
     Message: "Start administering prescribed medications"

DISPLAY: "Prescription created successfully!"
```

### **Step 5.5: Nurse Administers Medications**
```
📱 NURSE APP

SCREEN: Medication Administration
TAP: "Juan Dela Cruz" (Room 301)

DISPLAY SCHEDULED MEDICATIONS:
  Today's Schedule:
  ├─ 09:00 AM - Aspirin 500mg ⏱️ Due now
  ├─ 02:00 PM - Metoprolol 50mg ⏰ Scheduled
  ├─ 08:00 PM - Metoprolol 50mg ⏰ Scheduled
  └─ 09:00 PM - Atorvastatin 20mg ⏰ Scheduled

ACTION: TAP "09:00 AM - Aspirin 500mg"

MODAL OPENS: Medication Administration
  ├─ Patient: Juan Dela Cruz ✓
  ├─ Medication: Aspirin 500mg ✓
  ├─ Scheduled Time: 09:00 AM ✓
  ├─ Administration Time: 09:05 AM (auto-filled)
  ├─ Route: Oral ✓
  ├─ Administered By: Nurse Rosa ✓
  ├─ Notes: "Given with breakfast"
  └─ Confirmed: ☑ Medication given successfully

ACTION: TAP "Confirm Administration"

SYSTEM: POST /medication-logs
  Stores: {
    patient_id: 145,
    medication_id: 1,
    administered_at: "2024-09-28T09:05:00Z",
    administered_by: 25,
    route: "oral",
    notes: "Given with breakfast"
  }
  
DISPLAY: ✅ "Medication recorded"
UPDATE: Schedule shows "Aspirin - GIVEN ✓"
```

### **Step 5.6: Daily Monitoring**
```
DAYS 1-2: Initial Monitoring
  Nurse Tasks:
  ├─ Check vitals every 4 hours
  ├─ Administer medications on schedule
  ├─ Monitor ECG readings
  ├─ Document all observations
  ├─ Report concerns to doctor
  └─ Provide patient education

Doctor Tasks:
  ├─ Review daily progress notes
  ├─ Check lab results (ECG, Troponin, CK-MB)
  ├─ Adjust medications if needed
  ├─ Assess patient condition
  └─ Plan for next steps

PATIENT STATUS: 🟢 STABLE
  Vital Signs: Within acceptable range
  Pain Level: Reduced to 2/10
  Medications: Taking well
  Outlook: Good, responding to treatment
```

---

## PHASE 6: Prescription Management (Pharmacy)

### **Step 6.1: Pharmacy Receives Prescription**
```
📱 PHARMACY APP

NOTIFICATION: New prescription received
Patient: Juan Dela Cruz (MRN-00145)
Date: Today, 9:30 AM

SCREEN: Pending Prescriptions

DISPLAY:
  ┌─────────────────────────┐
  │ Juan Dela Cruz          │
  │ Room: 301               │
  │ Doctor: Dr. Reyes       │
  │ 4 medications to prep   │
  │                         │
  │ [VIEW DETAILS]          │
  └─────────────────────────┘
```

### **Step 6.2: Pharmacy Reviews and Prepares**
```
ACTION: TAP "VIEW DETAILS"

DISPLAY PRESCRIPTIONS:
  1. Aspirin 500mg - Daily
  2. Atorvastatin 20mg - Daily
  3. Metoprolol 50mg - Twice daily
  4. Clopidogrel 75mg - Daily

PHARMACY CHECKS:
  ✓ Medication availability
  ✓ Drug interactions
  ✓ Patient allergies: ⚠️ Penicillin (Not in list - OK)
  ✓ Dosages appropriate
  ✓ Expiry dates valid

ACTION: TAP "PREPARE MEDICATIONS"

SYSTEM:
  - Updates inventory
  - Generates labels
  - Marks prescription as "In Progress"
  - Prepares medication packets

ACTION: TAP "DISPENSE"

SYSTEM:
  - Marks prescription as "Ready"
  - Notifies Nurse: "Medications ready for Juan Dela Cruz"
  - Records dispensing in logs
```

---

## PHASE 7: Discharge Process (Doctor & Info Desk)

### **Scenario Setup**
```
Time: Day 3, 10:00 AM
Location: Cardiology Ward
Patient Status: Stable, improved, ready for discharge
Doctor: Dr. Reyes
Info Desk: Maria
```

### **Step 7.1: Doctor Reviews and Decides Discharge**
```
📱 DOCTOR APP

SCREEN: Patient Record (Juan Dela Cruz)

DISPLAY PATIENT STATUS:
  ├─ Admitted: 3 days ago
  ├─ Reason: Suspected ACS
  ├─ Lab Results: All normal ✓
  ├─ ECG: Improved ✓
  ├─ Vital Signs: Stable ✓
  ├─ Pain Level: 0/10 ✓
  ├─ Medications: Tolerating well ✓
  └─ Prognosis: Ready for discharge ✓

ASSESSMENT:
  "Patient has responded well to treatment.
   No further acute issues. Safe for discharge
   with outpatient follow-up in 2 weeks."

ACTION: TAP "Request Discharge"
```

### **Step 7.2: Doctor Fills Discharge Information**
```
MODAL OPENS: Discharge Request

FORM FIELDS:

  ├─ Final Diagnosis
  │  └─ "Acute Coronary Syndrome, managed
  │       ECG normalized, troponin negative"
  │
  ├─ Discharge Summary
  │  └─ "Patient admitted with acute chest pain.
  │       Workup completed. Cardiac enzymes negative.
  │       ECG shows normal sinus rhythm.
  │       Patient educated on medications and lifestyle."
  │
  ├─ Condition at Discharge
  │  └─ Radio: [Stable / Fair / Good / Excellent]
  │     Selection: "Stable"
  │
  ├─ Medications Prescribed
  │  └─ Display: (Auto-filled from prescription list)
  │     ├─ Aspirin 500mg - 30 days
  │     ├─ Atorvastatin 20mg - 90 days
  │     ├─ Metoprolol 50mg - 60 days
  │     └─ Clopidogrel 75mg - 12 months
  │
  ├─ Follow-up Instructions
  │  └─ "1. Continue medications as prescribed
  │       2. Follow-up cardiology clinic: 2 weeks
  │       3. Avoid strenuous activities for 1 week
  │       4. Call if chest pain recurs
  │       5. Monitor diet - reduce salt/fat intake"
  │
  ├─ Lifestyle Recommendations
  │  └─ "- No smoking
  │       - Moderate exercise (walking 30 min daily)
  │       - Manage stress
  │       - Regular sleep schedule
  │       - Reduce caffeine"
  │
  └─ Doctor Notes
     └─ "Patient educated. Understands medication regimen.
          Will follow up as scheduled. Call contact provided."

ACTION: TAP "Request Discharge"
```

### **Step 7.3: Submit Discharge Request**
```
SYSTEM ACTIONS:
  1. PUT /admissions/87
     PAYLOAD:
     {
       "status": "admitted",
       "discharge_requested": true,
       "discharge_requested_by": 12,
       "discharge_requested_at": "2024-10-01T10:00:00Z",
       "final_diagnosis": "Acute Coronary Syndrome, managed",
       "discharge_summary": "Patient admitted with acute...",
       "condition_at_discharge": "stable",
       "follow_up_date": "2024-10-15",
       "follow_up_instructions": "Continue medications..."
     }
  
  2. Create discharge prescription
     POST /prescriptions (type: "discharge")
     With take-home medications
  
  3. Send notification to Info Desk
     Type: "Ready for Discharge"
     Message: "Juan Dela Cruz (Room 301) ready for discharge"

DISPLAY: "Discharge request submitted!"

📱 INFO DESK APP:
   TAB: "Admitted" → Patient moves to "Awaiting Discharge"
   Shows: "Juan Dela Cruz - Ready to discharge"
```

### **Step 7.4: Info Desk Finalizes Discharge**
```
📱 INFO DESK APP

SCREEN: Admission Management
TAB: "Admitted" or "Awaiting Discharge"

DISPLAY:
  ┌──────────────────────────────┐
  │ Juan Dela Cruz               │
  │ Room: 301                    │
  │ Status: 🟡 Awaiting Discharge│
  │ Doctor: Dr. Reyes            │
  │                              │
  │ [PROCESS DISCHARGE]          │
  └──────────────────────────────┘

ACTION: TAP "PROCESS DISCHARGE"
```

### **Step 7.5: Generate Discharge Documents**
```
MODAL OPENS: Discharge Documents

SYSTEM GENERATES:

📄 DISCHARGE SUMMARY
  Hospital Name: PMed-Aid General Hospital
  Patient: Juan Dela Cruz
  MRN: MRN-00145
  Age: 58 years
  Admission Date: September 28, 2024
  Discharge Date: October 1, 2024
  Duration: 3 days
  
  Final Diagnosis: Acute Coronary Syndrome, managed
  
  Hospital Course: Patient was admitted with acute
  chest pain and shortness of breath. Cardiac workup
  was performed including ECG and troponin levels.
  All tests returned normal. Patient was started on
  cardiac medications and monitored. Patient's
  condition improved significantly.
  
  📋 MEDICATIONS AT DISCHARGE:
  1. Aspirin 500mg - Once daily - 30 days
  2. Atorvastatin 20mg - At bedtime - 90 days
  3. Metoprolol 50mg - Twice daily - 60 days
  4. Clopidogrel 75mg - Once daily - 12 months
  
  ⚠️ ALLERGIES: Penicillin, Shellfish, Latex
  
  📌 FOLLOW-UP:
  Cardiology Clinic: October 15, 2024, 2:00 PM
  
  📝 INSTRUCTIONS:
  - Take medications exactly as prescribed
  - Continue rest for 1 week
  - Avoid strenuous activities
  - Manage diet (low salt, low fat)
  - Call doctor if chest pain returns
  
  👨‍⚕️ Authorized by: Dr. Reyes
  🏥 Hospital Stamp & Signature

🔗 QR CODE GENERATED
  Code: [Scannable QR Code Image]
  Purpose: Link to patient app for medication reminders
  
  Patient can scan to:
  ✓ Set medication reminders
  ✓ Track adherence
  ✓ Access discharge instructions
  ✓ Schedule follow-up appointment
```

### **Step 7.6: Print and Finalize**
```
ACTION: TAP "PRINT & FINALIZE"

SYSTEM ACTIONS:
  1. Generate PDF of discharge documents
  2. Print discharge summary
  3. Print medication list
  4. Print QR code label
  5. Generate discharge certificate
  
  6. System Actions:
     - PUT /admissions/87
       { "status": "discharged" }
     - PUT /rooms/301
       { "is_occupied": false }
     - POST /audit-logs
       { "action": "patient_discharged" }

DISPLAY: "Discharge documents ready for printing"

NEXT STEP: Physical printout + patient handover
```

### **Step 7.7: Patient Handover**
```
PROCESS:
  1. Maria prints all documents
  2. Patient comes to Info Desk
  3. Maria explains:
     - Medication schedule
     - Follow-up appointment: October 15
     - What to do if symptoms return
     - Lifestyle changes needed
  
  4. Patient receives:
     ✓ Discharge Summary (copy)
     ✓ Medication List (copy)
     ✓ QR Code for app
     ✓ Follow-up appointment card
     ✓ Emergency contact numbers
  
  5. Patient acknowledges receipt
  
  6. Hospital records: ✅ Discharged
     Time: 2:00 PM
     Received by: Signature on form
```

### **Step 7.8: Discharge Completion**
```
✅ PATIENT DISCHARGED
   Discharge ID: 87
   Patient: Juan Dela Cruz (MRN-00145)
   Room: 301 (Now Available)
   Discharge Date: October 1, 2024, 2:00 PM
   Status: 🟢 DISCHARGED
   Follow-up: October 15, 2024

📱 SYSTEM UPDATES:
   ✓ Patient status: "admitted" → "discharged"
   ✓ Room: "occupied" → "available"
   ✓ Admission record archived
   ✓ Notifications sent to all staff
   
📊 STATISTICS:
   ✓ Length of stay: 3 days
   ✓ Medications prescribed: 4
   ✓ Follow-up scheduled
   ✓ Patient educated
```

---

## PHASE 8: Patient Home Care (Patient)

### **Step 8.1: Patient Receives QR Code**
```
LOCATION: Home
PATIENT: Juan Dela Cruz (Day 1 at home)

ACTION: Receives QR code in discharge papers

SCAN QR CODE using phone camera or patient app

APP OPENS: PMed-Aid Patient App
Automatic linking: QR Code ↔ Patient Account
Message: "Welcome! Your medications are ready to be tracked."
```

### **Step 8.2: Patient Links to Medication Reminders**
```
📱 PATIENT APP

SCREEN: QR Binding Success

DISPLAY:
  ✓ Account linked successfully!
  
  📋 YOUR MEDICATIONS:
  1. Aspirin 500mg
     When: Every morning after breakfast
     Until: October 31, 2024
     Status: 📅 Starting today
  
  2. Metoprolol 50mg
     When: 8:00 AM & 8:00 PM
     Until: November 30, 2024
  
  3. Atorvastatin 20mg
     When: Every night before bed
     Until: December 31, 2024
  
  4. Clopidogrel 75mg
     When: Every morning
     Until: September 30, 2025

BUTTON: "Set Reminders" → System sends notifications
```

### **Step 8.3: Patient Takes Medications at Home**
```
DAY 1 (October 1, Evening):
  ⏰ Reminder: "Time to take your medications"
  
  Patient opens app:
  ├─ Aspirin 500mg ✓ (Will take after breakfast tomorrow)
  ├─ Metoprolol 50mg (8:00 PM) - Time now!
  ├─ Atorvastatin 20mg ✓ (Will take at bedtime)
  └─ Clopidogrel 75mg (Tomorrow morning)
  
  Patient takes Metoprolol 50mg
  
  ACTION: TAP "I took this medication"
  
  SYSTEM: Records adherence
    POST /medication-logs
    {
      "patient_id": 145,
      "medication_id": 3,
      "taken_at": "2024-10-01T20:00:00Z",
      "status": "taken"
    }
  
  DISPLAY: ✅ "Logged successfully! Keep it up!"

DAY 2 - DAY 14:
  Patient continues taking medications
  System tracks adherence rate
  Reminders sent daily
  
  Adherence Tracking:
  - Day 1: 100% (2/2 medications taken)
  - Day 2: 100% (2/2 medications taken)
  - Day 3: 100% (2/2 medications taken)
  - ...
  - Day 14: 92% (Missed one dose)
  
  AVERAGE ADHERENCE: 98% ✅ Excellent!
```

### **Step 8.4: Follow-up Appointment**
```
TIME: October 15, 2024, 2:00 PM

PATIENT RECEIVES:
  ✓ Reminder on app: "Your cardiology follow-up is today"
  ✓ SMS reminder: "Cardiology appointment in 2 hours"
  
PATIENT ACTIONS:
  1. Goes to cardiology clinic
  2. Check-in at front desk
  3. Meets with Dr. Reyes
  4. Doctor reviews:
     - Vital signs
     - Medication adherence (98%!) ✓
     - Symptom status
     - Lab results if needed
  
  DOCTOR ASSESSMENT:
  "Patient doing excellent! No symptoms.
   Vital signs normal. Adherence outstanding.
   Continue current medications. Follow-up in 3 months."

PATIENT RECORDS:
  - Appointment completed
  - Vitals recorded
  - Medications continued
  - Next follow-up: January 15, 2025
```

### **Step 8.5: Long-term Management**
```
ONGOING (Months 1-12):

Patient's Responsibilities:
  ✓ Take medications daily (tracked via app)
  ✓ Maintain lifestyle changes
  ✓ Report any symptoms
  ✓ Attend follow-up appointments
  ✓ View medication history anytime

📊 ADHERENCE TRACKING:
  Current: 98% adherence over 3 months
  System: Alerts if missed doses
  Doctor: Reviews adherence at each visit
  
  Excellent adherence leads to:
  ✓ Better health outcomes
  ✓ Reduced complications
  ✓ Quicker recovery
  
🎯 LONG-TERM OUTCOMES:
  Patient successfully managing condition
  Regular follow-ups with doctor
  Medication adherence excellent
  No readmissions needed
  Quality of life improved
```

---

## Data Flow Diagrams

### **Complete System Data Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PMed-Aid System Architecture                 │
└─────────────────────────────────────────────────────────────────┘

📱 MOBILE APPS          🌐 WEB INTERFACE       💾 DATABASE
├─ Info Desk            ├─ Info Desk           ├─ Patients
├─ Doctor               ├─ Doctor              ├─ Consultations
├─ Nurse                ├─ Admin               ├─ Admissions
├─ Patient              ├─ Analytics           ├─ Prescriptions
├─ Pharmacy             └─ Reports             ├─ Medications
└─ Admin                                       ├─ Rooms
         │                  │                  ├─ Users
         └──────────────────┼──────────────────┤
                            ↓                  └─ Audit Logs
                    🔌 API SERVER
                    (Express.js)
                    
                    Routes:
                    ├─ /patients
                    ├─ /consultations
                    ├─ /admissions
                    ├─ /prescriptions
                    ├─ /medications
                    ├─ /users
                    ├─ /rooms
                    ├─ /qr-codes
                    └─ /audit-logs
```

### **Patient Journey Data Map**

```
PHASE 1: REGISTRATION
  Input: Patient info (name, age, contact, medical)
  Storage: Patient record created (patients table)
  Output: Patient ID (MRN-00145)

PHASE 2: CONSULTATION
  Input: Chief complaint, vitals, assessment
  Storage: Consultation record (consultations table)
  Output: Consultation ID, Doctor assignment

PHASE 3: ADMISSION REQUEST
  Input: Department, reason, treatment plan
  Storage: Update consultation status
  Output: Pending admission notification

PHASE 4: ROOM ASSIGNMENT
  Input: Room selection, nurse assignment
  Storage: Admission record (admissions table)
  Output: Admission ID, QR code generated

PHASE 5: PATIENT CARE
  Input: Vital signs, medications, notes
  Storage: Medication logs, vitals, progress notes
  Output: Adherence tracking, alerts

PHASE 6: DISCHARGE
  Input: Final diagnosis, discharge plan
  Storage: Discharge record, prescriptions
  Output: Discharge documents, QR code

PHASE 7: HOME CARE
  Input: Medication taken, adherence data
  Storage: Medication logs (at home)
  Output: Adherence reports, follow-up reminders
```

---

## API Endpoints Used

### **Patient Management**
```
POST   /patients                  Create new patient
GET    /patients                  List patients
GET    /patients/{id}             Get patient details
PUT    /patients/{id}             Update patient info
```

### **Consultation Management**
```
POST   /consultations             Queue new consultation
GET    /consultations             Get consultations
PUT    /consultations/{id}        Update consultation status
GET    /consultations/{id}        Get consultation details
```

### **Admission Management**
```
POST   /admissions                Create admission
GET    /admissions                Get admissions
GET    /admissions/{id}           Get admission details
PUT    /admissions/{id}           Update admission status
POST   /admissions/{id}/discharge Finalize discharge
```

### **Prescription Management**
```
POST   /prescriptions             Create prescription
GET    /prescriptions             Get prescriptions
PUT    /prescriptions/{id}        Update prescription
GET    /prescriptions/{id}        Get prescription details
```

### **Medication Logs**
```
POST   /medication-logs           Record medication administration
GET    /medication-logs           Get medication history
GET    /schedules/{id}/vitals     Get vital signs
```

### **Room Management**
```
GET    /rooms/available           Get available rooms
PUT    /rooms/{id}                Update room status
```

### **QR Code Management**
```
POST   /qr-codes                  Generate QR code
GET    /qr-codes/patient/{id}     Get patient QR codes
```

### **User Management**
```
GET    /users?role=doctor         Get doctors
GET    /users?role=nurse          Get nurses
GET    /users?role=pharmacy       Get pharmacy staff
```

---

## Summary: Complete Workflow

**8 Phases | 24+ Steps | Multiple Users | Comprehensive Patient Care**

The PMed-Aid system provides a complete end-to-end solution for hospital patient management, from initial registration through long-term post-discharge monitoring. Each phase builds on the previous, ensuring comprehensive care coordination and excellent patient outcomes.

**Key Success Factors:**
- ✅ Efficient patient registration and queuing
- ✅ Seamless doctor-patient consultations
- ✅ Smooth admission and room assignment
- ✅ Accurate medication management
- ✅ Proper discharge documentation
- ✅ Patient adherence tracking
- ✅ Continuous communication between all users
- ✅ Data integrity and audit trails
