import axios from 'axios';

const API_URL = 'http://localhost:3000';
let userToken: string;
let speakerToken: string;
let testTimeSlotId: string;
let testSessionId: string;

// Test user credentials
const testUser = {
  email: "test3@example.com",
  password: "password123",
  firstName: "Test",
  lastName: "User"
};

// Test speaker credentials
const testSpeaker = {
  email: "speaker2@example.com",
  password: "password123",
  firstName: "Test",
  lastName: "Speaker",
  expertise: ["JavaScript", "Node.js"],
  pricePerSession: 50
};

async function verifyOTP(email: string, otp: string, userType: 'USER' | 'SPEAKER') {
  try {
    const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
      email,
      otp,
      userType
    });
    console.log('OTP Verification Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('OTP Verification Error:', error.response?.data || error.message);
  }
}

async function login(email: string, password: string, userType: 'USER' | 'SPEAKER') {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
      userType
    });
    console.log('Login Response:', response.data);
    return response.data.token;
  } catch (error: any) {
    console.error('Login Error:', error.response?.data || error.message);
  }
}

async function registerSpeaker() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register/speaker`, testSpeaker);
    console.log('Speaker Registration Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Speaker Registration Error:', error.response?.data || error.message);
  }
}

async function createTimeSlots(token: string) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const slots = [
      {
        startTime: new Date(tomorrow.getTime()),
        endTime: new Date(tomorrow.setHours(10))
      },
      {
        startTime: new Date(tomorrow.setHours(11)),
        endTime: new Date(tomorrow.setHours(12))
      }
    ];

    const response = await axios.post(
      `${API_URL}/api/speakers/time-slots`,
      { date: tomorrow, slots },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Create Time Slots Response:', response.data);
    return response.data[0]?.id;
  } catch (error: any) {
    console.error('Create Time Slots Error:', error.response?.data || error.message);
  }
}

async function listSpeakers() {
  try {
    const response = await axios.get(`${API_URL}/api/speakers`);
    console.log('List Speakers Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('List Speakers Error:', error.response?.data || error.message);
  }
}

async function bookSession(token: string, timeSlotId: string) {
  try {
    const response = await axios.post(
      `${API_URL}/api/sessions/book`,
      { timeSlotId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Book Session Response:', response.data);
    return response.data.id;
  } catch (error: any) {
    console.error('Book Session Error:', error.response?.data || error.message);
  }
}

async function listUserSessions(token: string) {
  try {
    const response = await axios.get(
      `${API_URL}/api/sessions/my-sessions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('List User Sessions Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('List User Sessions Error:', error.response?.data || error.message);
  }
}

async function cancelSession(token: string, sessionId: string) {
  try {
    const response = await axios.delete(
      `${API_URL}/api/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Cancel Session Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Cancel Session Error:', error.response?.data || error.message);
  }
}

// Main test sequence
async function runTests() {
  try {
    // Step 1: Verify User OTP
    console.log('\n1. Verifying User OTP...');
    const userOtpResult = await verifyOTP(testUser.email, '782822', 'USER'); // Replace YOUR_OTP_HERE with the OTP you received

    if (userOtpResult) {
      // Step 2: User Login
      console.log('\n2. User Login...');
      userToken = await login(testUser.email, testUser.password, 'USER') || '';

      // Step 3: Register Speaker
      console.log('\n3. Registering Speaker...');
      await registerSpeaker();

      // After this point, you need the speaker's OTP
      console.log('\n4. Please update the speaker OTP in the code and run the next test sequence');
      
      // Uncomment and update these lines for the next test sequence:
      /*
      // Step 4: Verify Speaker OTP
      await verifyOTP(testSpeaker.email, 'SPEAKER_OTP_HERE', 'SPEAKER');
      
      // Step 5: Speaker Login
      speakerToken = await login(testSpeaker.email, testSpeaker.password, 'SPEAKER') || '';
      
      // Step 6: Create Time Slots
      testTimeSlotId = await createTimeSlots(speakerToken) || '';
      
      // Step 7: List Speakers
      await listSpeakers();
      
      if (testTimeSlotId) {
        // Step 8: Book Session
        testSessionId = await bookSession(userToken, testTimeSlotId) || '';
        
        // Step 9: List User Sessions
        await listUserSessions(userToken);
        
        if (testSessionId) {
          // Step 10: Cancel Session
          await cancelSession(userToken, testSessionId);
        }
      }
      */
    }
  } catch (error) {
    console.error('Test sequence error:', error);
  }
}

// Run the tests
runTests();