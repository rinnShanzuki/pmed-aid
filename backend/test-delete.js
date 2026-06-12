const axios = require('axios');

async function testDelete() {
  try {
    // First we need to login as admin to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@pmed-aid.com',
      password: 'admin' // wait, what is the admin password? Let's check DB or bypass
    });
  } catch (e) {
    console.error(e.message);
  }
}
// Actually, it's easier to just call the userController.delete directly from a script, or just check the Network tab in the screenshot!
