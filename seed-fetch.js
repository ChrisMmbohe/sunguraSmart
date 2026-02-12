// Use the built-in fetch instead of http module
async function seedProducts() {
  console.log('🌱 Seeding products...');
  
  try {
    console.log('Sending request to http://localhost:3000/api/seed/products');
    
    const response = await fetch('http://localhost:3000/api/seed/products', {
      method: 'POST',
      headers: {
        'x-api-secret': 'my-farm-dev-secret-2025',
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Seeding successful!');
      console.log('Status:', response.status);
      console.log('Message:', data.message);
      if (data.data && Array.isArray(data.data)) {
        console.log(`Created ${data.data.length} products`);
        console.log('Samples:', data.data.slice(0, 2).map(p => `- ${p.name} ($${p.price})`).join('\n'));
      }
    } else {
      console.log('❌ Seeding failed!');
      console.log('Status:', response.status);
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

seedProducts();
