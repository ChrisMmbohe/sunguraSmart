const http = require('http');

// Test 1: Simple endpoint
const testOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
};

console.log('Testing basic connectivity...');

const testReq = http.request(testOptions, (res) => {
  console.log(`✅ Server is responding with status ${res.statusCode}`);
  
  // Test 2: Seed endpoint
  setTimeout(() => {
    console.log('\n🌱 Now attempting to seed products...');
    
    const seedOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/seed/products',
      method: 'POST',
      headers: {
        'x-api-secret': 'my-farm-dev-secret-2025',
        'Content-Length': 0,
      },
      timeout: 60000,
    };

    const seedReq = http.request(seedOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success || response.message) {
            console.log('✅ Seeding successful!');
            console.log('Status:', res.statusCode);
            console.log('Message:', response.message);
            if (response.data && Array.isArray(response.data)) {
              console.log(`Created ${response.data.length} products`);
            }
          } else if (response.error) {
            console.log('⚠️ Seeding returned error:');
            console.log('Status:', res.statusCode);
            console.log('Error:', response.error);
          }
        } catch (e) {
          console.log('Response (raw):', data.substring(0, 200));
        }
        process.exit(0);
      });
    });

    seedReq.on('error', (error) => {
      console.error('❌ Seed request error:', error.message);
      process.exit(1);
    });

    seedReq.on('timeout', () => {
      console.error('❌ Seed request timeout');
      seedReq.destroy();
      process.exit(1);
    });

    seedReq.end();
  }, 1000);
});

testReq.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

testReq.end();
