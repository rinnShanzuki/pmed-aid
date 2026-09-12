const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(JSON.stringify(data));
    }
    return data;
}

async function testOverallFlow() {
    try {
        console.log('--- PMed-Aid Overall System Flow Test ---');
        
        // 1. Admin Login
        console.log('\n[1] Logging in as Admin...');
        let data = await request('/auth/login', 'POST', {
            email: 'admin@hospital.local',
            password: 'admin123'
        });
        const adminToken = data.data.token;
        console.log('✅ Admin login successful');

        // 2. Info Desk Login
        console.log('\n[2] Logging in as Information Desk...');
        data = await request('/auth/login', 'POST', {
            email: 'infodesk@hospital.local',
            password: 'infodesk123'
        });
        const infoToken = data.data.token;
        console.log('✅ Information Desk login successful');

        // 3. Create Patient
        console.log('\n[3] Creating a new Patient...');
        const patientData = {
            first_name: 'TestFlow2',
            last_name: 'Patient2',
            date_of_birth: '1990-05-15',
            gender: 'male',
            contact_number: '09123456789',
            address: '123 Test Ave'
        };
        data = await request('/patients', 'POST', patientData, infoToken);
        const patientId = data.data.id;
        console.log(`✅ Patient created successfully (ID: ${patientId})`);

        // 4. Doctor Login (to get ID)
        console.log('\n[4] Logging in as Doctor...');
        data = await request('/auth/login', 'POST', {
            email: 'doctor@hospital.local',
            password: 'doctor123'
        });
        const docToken = data.data.token;
        const docId = data.data.user.id;
        console.log(`✅ Doctor login successful (ID: ${docId})`);

        // 5. Create Consultation
        console.log('\n[5] Creating Consultation...');
        const consultationData = {
            patient_id: patientId,
            doctor_id: docId,
            department: 'General Medicine',
            reason_for_visit: 'Fever and chills',
            notes: 'Patient feels weak',
            priority: 'normal'
        };
        data = await request('/consultations', 'POST', consultationData, infoToken);
        const consultId = data.data.id;
        console.log(`✅ Consultation created successfully (ID: ${consultId})`);

        // 6. Request Admission (Doctor)
        console.log('\n[6] Doctor requesting Admission...');
        await request(`/consultations/${consultId}/request-admission`, 'POST', {
            notes: 'Requires IV fluids',
            diagnosis: 'Viral Fever',
            department: 'General Medicine',
            treatment_plan: 'IV Fluids and Rest'
        }, docToken);
        console.log('✅ Admission requested by doctor');

        // 7. Information Desk assigns room and admits
        console.log('\n[7] Info Desk Admits Patient...');
        const roomsData = await request('/rooms/available', 'GET', null, infoToken);
        const roomId = roomsData.data[0]?.id;
        if (!roomId) throw new Error("No available rooms to admit the patient.");

        await request('/admissions', 'POST', {
            patient_id: patientId,
            room_id: roomId,
            attending_doctor_id: docId,
            consultation_id: consultId,
            department: 'General Medicine',
            reason_for_admission: 'Fever and chills',
            notes: 'Processed by Info Desk'
        }, infoToken);
        console.log('✅ Patient admitted to room', roomId);

        // Fetch active admission for patient
        data = await request('/admissions', 'GET', null, docToken);
        const activeAdmission = data.data.find(a => a.patient_id === patientId && a.status === 'admitted');
        
        if (!activeAdmission) {
            console.log('❌ Admission not found for patient.');
            return;
        }
        const admissionId = activeAdmission.id;
        console.log(`✅ Fetched active admission (ID: ${admissionId})`);

        // 8. Doctor Prescribes Medication
        console.log('\n[8] Doctor Prescribing Medication...');
        const rxData = {
            admission_id: admissionId,
            patient_id: patientId,
            type: 'in_hospital',
            notes: 'For fever',
            items: [
                {
                    medication_name: 'Paracetamol',
                    dosage: '500',
                    dosage_unit: 'mg',
                    frequency: 3,
                    frequency_unit: 'daily',
                    route: 'Oral',
                    duration: 3,
                    duration_unit: 'days',
                    instructions: 'Take after meals'
                }
            ]
        };
        data = await request('/prescriptions', 'POST', rxData, docToken);
        const rxId = data.data.id;
        console.log(`✅ Prescription created successfully (ID: ${rxId})`);

        // 9. Pharmacy checks active prescriptions
        console.log('\n[9] Logging in as Pharmacy...');
        data = await request('/auth/login', 'POST', {
            email: 'pharmacy@hospital.local',
            password: 'pharmacy123'
        });
        const pharmToken = data.data.token;
        console.log('✅ Pharmacy login successful');

        console.log('\n[10] Pharmacy fetching prescriptions...');
        data = await request('/prescriptions', 'GET', null, pharmToken);
        console.log(`✅ Pharmacy retrieved ${data.data.length} prescriptions`);

        // 11. Info Desk requests discharge
        console.log('\n[11] Information Desk processing discharge...');
        await request(`/admissions/${admissionId}/discharge`, 'POST', {
            notes: 'Patient recovered',
            condition_at_discharge: 'Stable'
        }, infoToken);
        console.log(`✅ Patient discharged successfully.`);

        console.log('\n🎉 ALL CORE FLOWS COMPLETED SUCCESSFULLY!');
    } catch (error) {
        console.error('❌ Flow Test Failed:', error.message);
    }
}

testOverallFlow();
