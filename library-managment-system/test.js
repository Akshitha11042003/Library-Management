const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('--- Starting API Tests ---');
  let tokenAdmin = '';
  let tokenUser = '';
  
  try {
    console.log('1. Authentication');
    // Register User
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('✅ Register User:', regRes.status);
    tokenUser = regRes.data.data.token;

    // Register Admin
    const regAdminRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'ADMIN' // if this is how it works, else we need to see how to create admin
    });
    console.log('✅ Register Admin:', regAdminRes.status);
    tokenAdmin = regAdminRes.data.data.token;
  } catch (err) {
    console.error('❌ Auth Register Error:', err.response?.data || err.message);
  }

  try {
    // Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    console.log('✅ Login:', loginRes.status);
    if(!tokenUser) tokenUser = loginRes.data.data.token;
  } catch (err) {
    console.error('❌ Auth Login Error:', err.response?.data || err.message);
  }

  console.log('\n--- Tests Completed ---');
}

testAPI();
