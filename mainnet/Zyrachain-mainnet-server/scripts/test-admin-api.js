const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4000';
const TEST_EMAIL = 'admin@example.com';
const TEST_ROLE = 'admin';

class AdminApiTester {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'admin-api-tester'
      }
    });
    
    this.token = null;
  }

  // Add auth token to requests
  setAuthToken(token) {
    this.token = token;
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  // Test authentication
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    try {
      // Step 1: Request OTP
      console.log('📧 Requesting OTP...');
      const otpResponse = await this.client.post('/api/admin/auth', {
        email: TEST_EMAIL,
        role: TEST_ROLE
      });
      
      if (otpResponse.data.success) {
        console.log('✅ OTP request successful');
        
        // In a real scenario, you would get the OTP from email
        // For testing, we'll simulate with a dummy OTP
        const testOTP = '123456'; // This won't work in real testing
        
        console.log('⚠️  Note: Using dummy OTP for testing. In real scenario, check email for actual OTP.');
        console.log(`📧 Please check email for OTP and update the testOTP variable with the actual code.`);
        
        // Uncomment the following lines when you have the real OTP:
        /*
        const authResponse = await this.client.post('/api/admin/auth', {
          email: TEST_EMAIL,
          role: TEST_ROLE,
          otp: testOTP
        });
        
        if (authResponse.data.success && authResponse.data.token) {
          console.log('✅ Authentication successful');
          this.setAuthToken(authResponse.data.token);
          return true;
        } else {
          console.log('❌ Authentication failed:', authResponse.data.message);
          return false;
        }
        */
        
        return false; // Return false for now since we're using dummy OTP
      } else {
        console.log('❌ OTP request failed:', otpResponse.data.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Authentication test failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test health check
  async testHealthCheck() {
    console.log('\n🏥 Testing Health Check...');
    
    try {
      const response = await this.client.get('/health');
      console.log('✅ Health check successful');
      console.log('📊 Health data:', response.data);
      return true;
    } catch (error) {
      console.log('❌ Health check failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test existing admin endpoints
  async testAdminEndpoints() {
    console.log('\n🔧 Testing Existing Admin Endpoints...');
    
    const endpoints = [
      '/api/admin/users',
      '/api/admin/listings',
      '/api/admin/analytics',
      '/api/admin/communities/combined',
      '/api/admin/influencers/combined',
      '/api/admin/addresses/generated',
      '/api/admin/addresses/cex',
      '/api/admin/addresses/core-team'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        const response = await this.client.get(endpoint);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`🔒 ${endpoint} - Requires authentication (expected)`);
        } else {
          console.log(`❌ ${endpoint} - Error: ${error.response?.data?.error || error.message}`);
        }
      }
    }
  }

  // Test blog endpoints
  async testBlogEndpoints() {
    console.log('\n📝 Testing Blog Endpoints...');
    
    const endpoints = [
      '/api/blog/posts',
      '/api/blog/categories',
      '/api/blog/tags'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        const response = await this.client.get(endpoint);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.response?.data?.error || error.message}`);
      }
    }
  }

  // Test listings endpoints
  async testListingsEndpoints() {
    console.log('\n🏢 Testing Listings Endpoints...');
    
    const endpoints = [
      '/api/listings/business',
      '/api/listings/startup',
      '/api/listings/community',
      '/api/listings/influencer'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        const response = await this.client.get(endpoint);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.response?.data?.error || error.message}`);
      }
    }
  }

  // Test ecosystem endpoints
  async testEcosystemEndpoints() {
    console.log('\n🌐 Testing Ecosystem Endpoints...');
    
    const endpoints = [
      '/api/ecosystem/events',
      '/api/ecosystem/hackathons',
      '/api/ecosystem/communities'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        const response = await this.client.get(endpoint);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.response?.data?.error || error.message}`);
      }
    }
  }

  // Test CORS
  async testCORS() {
    console.log('\n🌐 Testing CORS...');
    
    try {
      const response = await this.client.get('/cors-test');
      console.log('✅ CORS test successful');
      console.log('📊 CORS data:', response.data);
      return true;
    } catch (error) {
      console.log('❌ CORS test failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test server info
  async testServerInfo() {
    console.log('\n📋 Testing Server Info...');
    
    try {
      const response = await this.client.get('/');
      console.log('✅ Server info successful');
      console.log('📊 Server info:', response.data);
      return true;
    } catch (error) {
      console.log('❌ Server info failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Admin API Tests...');
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log('📋 Testing existing admin routes (not the new admin-api routes)');
    
    const results = {
      healthCheck: await this.testHealthCheck(),
      cors: await this.testCORS(),
      serverInfo: await this.testServerInfo(),
      authentication: await this.testAuthentication(),
      adminEndpoints: await this.testAdminEndpoints(),
      blogEndpoints: await this.testBlogEndpoints(),
      listingsEndpoints: await this.testListingsEndpoints(),
      ecosystemEndpoints: await this.testEcosystemEndpoints()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Admin API is ready for use.');
    } else {
      console.log('⚠️  Some tests failed. Please check the server configuration.');
    }
    
    console.log('\n📝 Notes:');
    console.log('- Authentication tests require real email setup and OTP');
    console.log('- Admin endpoints require authentication (401 is expected without token)');
    console.log('- Some endpoints may return 404 if no data exists (this is normal)');
    
    return results;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AdminApiTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AdminApiTester; 