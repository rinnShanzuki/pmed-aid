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

async function testNotifications() {
    try {
        console.log('--- PMed-Aid Notifications Test ---');
        
        // 1. Info Desk Login
        console.log('\n[1] Logging in as Information Desk...');
        let data = await request('/auth/login', 'POST', {
            email: 'infodesk@hospital.local',
            password: 'infodesk123'
        });
        const infoToken = data.data.token;
        const infoUserId = data.data.user.id;
        console.log(`✅ Information Desk login successful (User ID: ${infoUserId})`);

        // Check initial notifications
        let initialNotifs = await request('/notifications', 'GET', null, infoToken);
        console.log(`Initial Unread Count: ${initialNotifs.meta.unread_count}`);

        // 2. Create Patient
        console.log('\n[2] Creating a new Patient...');
        data = await request('/patients', 'POST', {
            first_name: 'NotifTest',
            last_name: 'Patient',
            date_of_birth: '1995-01-01',
            gender: 'male',
            contact_number: '09123456789',
            address: 'Test Ave'
        }, infoToken);
        const patientId = data.data.id;
        console.log(`✅ Patient created (ID: ${patientId})`);

        // 3. Doctor Login
        console.log('\n[3] Logging in as Doctor...');
        data = await request('/auth/login', 'POST', {
            email: 'doctor@hospital.local',
            password: 'doctor123'
        });
        const docToken = data.data.token;
        const docId = data.data.user.id;

        // 4. Create Consultation
        data = await request('/consultations', 'POST', {
            patient_id: patientId,
            doctor_id: docId,
            department: 'General Medicine',
            reason_for_visit: 'Test Notif',
            notes: 'Test',
            priority: 'normal'
        }, infoToken);
        const consultId = data.data.id;
        console.log(`✅ Consultation created (ID: ${consultId})`);

        // 5. Doctor Requests Admission (This triggers a notification to info desk)
        console.log('\n[4] Doctor requesting Admission...');
        await request(`/consultations/${consultId}/request-admission`, 'POST', {
            notes: 'Requires IV fluids',
            diagnosis: 'Viral Fever',
            department: 'General Medicine',
            treatment_plan: 'IV Fluids'
        }, docToken);
        console.log('✅ Admission requested by doctor');

        // 6. Check Notifications again for Info Desk
        console.log('\n[5] Checking Notifications for Info Desk...');
        let newNotifs = await request('/notifications', 'GET', null, infoToken);
        console.log(`New Unread Count: ${newNotifs.meta.unread_count}`);
        
        if (newNotifs.meta.unread_count <= initialNotifs.meta.unread_count) {
             throw new Error("Unread count did not increase!");
        }
        
        const latestNotif = newNotifs.data[0];
        console.log(`✅ Latest Notification: [${latestNotif.priority.toUpperCase()}] ${latestNotif.title} - ${latestNotif.message}`);

        // 7. Mark as Read
        console.log(`\n[6] Marking notification ${latestNotif.id} as read...`);
        await request(`/notifications/${latestNotif.id}/read`, 'PUT', null, infoToken);
        
        let finalNotifs = await request('/notifications', 'GET', null, infoToken);
        console.log(`Final Unread Count: ${finalNotifs.meta.unread_count}`);
        
        if (finalNotifs.meta.unread_count !== newNotifs.meta.unread_count - 1) {
            throw new Error("Unread count did not decrease after marking as read!");
        }
        
        console.log('\n🎉 NOTIFICATIONS FLOW TESTED SUCCESSFULLY!');
    } catch (error) {
        console.error('❌ Flow Test Failed:', error.message);
    }
}

testNotifications();
