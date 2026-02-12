const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/seed/products',
  method: 'POST',
  headers: {
    'x-api-secret': 'my-farm-dev-secret-2025',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
};

let timedOut = false;

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (timedOut) return;
    
    try {
      const response = JSON.parse(data);
      console.log('✅ Seeding successful!');
      console.log('Status:', res.statusCode);
      console.log('Message:', response.message || response.error);
      if (response.data && Array.isArray(response.data)) {
        console.log('Products created:', response.data.length);
        console.log('Sample:', response.data.slice(0, 2).map(p => p.name));
      }
    } catch (e) {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  if (!timedOut) {
    console.error('❌ Network error:', error.message);
    process.exit(1);
  }
});

req.on('timeout', () => {
  timedOut = true;
  console.error('❌ Request timeout after 30 seconds');
  req.destroy();
  process.exit(1);
});

console.log('🌱 Seeding products...');
req.end();
