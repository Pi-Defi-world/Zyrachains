require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...');
  console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.log('MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'undefined');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Successfully connected to MongoDB Atlas');

    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));

    // Test specific collections
    const testCollections = ['communities', 'influencers', 'events', 'hackathons', 'blogposts'];
    
    for (const collectionName of testCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📊 ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`❌ ${collectionName}: Error - ${error.message}`);
      }
    }

    await client.close();
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection(); 