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

async function testRecentChanges() {
    try {
        console.log('--- Testing Recent Changes ---');
        
        // 1. Info Desk Login
        console.log('\n[1] Logging in as Information Desk...');
        let data = await request('/auth/login', 'POST', {
            email: 'infodesk@hospital.local',
            password: 'infodesk123'
        });
        const infoToken = data.data.token;
        console.log(`✅ Information Desk login successful`);

        // 2. Doctor Login
        console.log('\n[2] Logging in as Doctor...');
        data = await request('/auth/login', 'POST', {
            email: 'doctor@hospital.local',
            password: 'doctor123'
        });
        const docToken = data.data.token;
        const docId = data.data.user.id;
        console.log(`✅ Doctor login successful (ID: ${docId})`);

        // Check Doctor Initial Notifications
        const initialDocNotifs = await request('/notifications', 'GET', null, docToken);
        const initialDocCount = initialDocNotifs.meta.unread_count;
        console.log(`Initial Doctor Unread Count: ${initialDocCount}`);

        // 3. Create Patient
        console.log('\n[3] Creating a new Patient...');
        data = await request('/patients', 'POST', {
            first_name: 'FilterTest',
            last_name: 'Patient',
            date_of_birth: '1990-05-05',
            gender: 'female',
            contact_number: '09998887777',
            address: 'Filter Ave'
        }, infoToken);
        const patientId = data.data.id;
        console.log(`✅ Patient created (ID: ${patientId})`);

        // 4. Test Search BEFORE Consultation (Should find patient)
        console.log('\n[4] Testing Patient Search BEFORE consultation...');
        let searchRes = await request('/patients?exclude_active=true&search=FilterTest', 'GET', null, infoToken);
        let found = searchRes.data.some(p => p.id === patientId);
        if (!found) throw new Error("Patient NOT found before consultation (Should be found!)");
        console.log(`✅ Patient successfully found in search BEFORE consultation.`);

        // 5. Create Consultation
        console.log('\n[5] Creating Consultation (Assigning to Doctor)...');
        data = await request('/consultations', 'POST', {
            patient_id: patientId,
            doctor_id: docId,
            department: 'General Medicine',
            reason_for_visit: 'Filter Test Visit',
            notes: 'Test',
            priority: 'normal'
        }, infoToken);
        const consultId = data.data.id;
        console.log(`✅ Consultation created (ID: ${consultId})`);

        // 6. Test Search AFTER Consultation (Should NOT find patient)
        console.log('\n[6] Testing Patient Search AFTER consultation (Testing Filter)...');
        searchRes = await request('/patients?exclude_active=true&search=FilterTest', 'GET', null, infoToken);
        found = searchRes.data.some(p => p.id === patientId);
        if (found) throw new Error("Patient FOUND after consultation (Should NOT be found because they are active!)");
        console.log(`✅ SUCCESS: Patient is correctly filtered out of search results while active!`);

        // 7. Check Doctor Notifications
        console.log('\n[7] Checking Doctor Notifications...');
        const newDocNotifs = await request('/notifications', 'GET', null, docToken);
        const newDocCount = newDocNotifs.meta.unread_count;
        console.log(`New Doctor Unread Count: ${newDocCount}`);
        
        if (newDocCount <= initialDocCount) {
             throw new Error("Doctor unread count did not increase!");
        }
        
        const latestDocNotif = newDocNotifs.data[0];
        console.log(`✅ SUCCESS: Latest Doctor Notification: [${latestDocNotif.priority.toUpperCase()}] ${latestDocNotif.title} - ${latestDocNotif.message}`);
        console.log(`✅ Routing metadata check -> related_consultation_id: ${latestDocNotif.related_consultation_id}`);
        
        if (latestDocNotif.related_consultation_id !== consultId) {
            throw new Error("related_consultation_id does not match the consultation ID!");
        }

        console.log('\n🎉 ALL RECENT CHANGES TESTED SUCCESSFULLY!');
    } catch (error) {
        console.error('\n❌ Flow Test Failed:', error.message);
    }
}

testRecentChanges();
