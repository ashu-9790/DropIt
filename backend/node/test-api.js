/**
 * Quick API test script
 * Run with: node test-api.js
 */

const API_BASE = 'http://localhost:8080';

async function testAPI() {
  console.log('🧪 Testing RoastorToast API...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (err) {
    console.error('❌ Health check failed:', err.message);
    return;
  }

  // Test 2: Generate Message
  console.log('\n2️⃣ Testing generate endpoint...');
  let shareId;
  try {
    const response = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_name: 'Test User',
        recipient_name: 'Test Recipient',
        quirks: 'loves testing APIs',
        vibe: 'Roast',
        language: 'English',
      }),
    });
    const data = await response.json();
    if (data.success) {
      shareId = data.share_id;
      console.log('✅ Message generated:', data);
    } else {
      console.error('❌ Generate failed:', data);
      return;
    }
  } catch (err) {
    console.error('❌ Generate failed:', err.message);
    return;
  }

  // Test 3: Get Message
  console.log('\n3️⃣ Testing get message endpoint...');
  try {
    const response = await fetch(`${API_BASE}/api/message/${shareId}`);
    const data = await response.json();
    if (data.success) {
      console.log('✅ Message retrieved:', {
        vibe: data.data.vibe,
        title: data.data.content.title,
        stats: data.data.stats,
      });
    } else {
      console.error('❌ Get message failed:', data);
    }
  } catch (err) {
    console.error('❌ Get message failed:', err.message);
  }

  // Test 4: Record Share
  console.log('\n4️⃣ Testing record share endpoint...');
  try {
    const response = await fetch(`${API_BASE}/api/message/${shareId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (data.success) {
      console.log('✅ Share recorded:', data);
    } else {
      console.error('❌ Record share failed:', data);
    }
  } catch (err) {
    console.error('❌ Record share failed:', err.message);
  }

  // Test 5: Get Stats
  console.log('\n5️⃣ Testing stats endpoint...');
  try {
    const response = await fetch(`${API_BASE}/api/stats`);
    const data = await response.json();
    if (data.success) {
      console.log('✅ Stats retrieved:', data.data);
    } else {
      console.error('❌ Get stats failed:', data);
    }
  } catch (err) {
    console.error('❌ Get stats failed:', err.message);
  }

  // Test 6: Validation (should fail)
  console.log('\n6️⃣ Testing validation (should fail)...');
  try {
    const response = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator_name: '',
        recipient_name: 'Test',
        quirks: 'x',
        vibe: 'Invalid',
        language: 'English',
      }),
    });
    const data = await response.json();
    if (!data.success && response.status === 400) {
      console.log('✅ Validation working:', data.details);
    } else {
      console.error('❌ Validation not working properly');
    }
  } catch (err) {
    console.error('❌ Validation test failed:', err.message);
  }

  console.log('\n✨ API tests complete!\n');
}

testAPI().catch(console.error);
