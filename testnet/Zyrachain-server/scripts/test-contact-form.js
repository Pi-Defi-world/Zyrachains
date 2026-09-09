const testContactForm = async () => {
  try {
    console.log('Testing contact form submission...');
    
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Contact Form',
      message: 'This is a test message to verify the contact form functionality.'
    };

    const response = await fetch('http://localhost:8000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Contact form test successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Contact form test failed!');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Contact form test error:', error.message);
  }
};

// Run the test
testContactForm(); 