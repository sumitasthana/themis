import fetch from 'node-fetch';

const testChat = async () => {
  try {
    console.log('Testing Themis Chat API...\n');
    
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'dashboard',
        messages: [
          { role: 'user', text: 'What is AML compliance?' }
        ]
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Response Success!\n');
      console.log('Response:', data.text);
    } else {
      console.log('❌ API Error:\n');
      console.log('Status:', response.status);
      console.log('Error:', data);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

testChat();
