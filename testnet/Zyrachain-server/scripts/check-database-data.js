const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/infogram');

// Import compiled models
const EcosystemCommunity = require('./dist/lib/models/EcosystemCommunity').default;
const EcosystemEvent = require('./dist/lib/models/EcosystemEvent').default;
const EcosystemHackathon = require('./dist/lib/models/EcosystemHackathon').default;
const CommunityListing = require('./dist/lib/models/CommunityListing').default;
const BusinessListing = require('./dist/lib/models/BusinessListing').default;
const StartupListing = require('./dist/lib/models/StartupListing').default;
const ProjectListing = require('./dist/lib/models/ProjectListing').default;
const InfluencerListing = require('./dist/lib/models/InfluencerListing').default;
const BlogPost = require('./dist/lib/models/BlogPost').default;

async function checkAllCollections() {
  try {
    await new Promise(resolve => mongoose.connection.once('open', resolve));
    const db = mongoose.connection.db;
    
    console.log('🔍 SCANNING ENTIRE DATABASE...\n');
    console.log(`Database: ${db.databaseName}\n`);
    
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} total collections:\n`);
    
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`📁 Collection: "${col.name}"`);
      console.log(`   📊 Document count: ${count}`);
      
      if (count > 0) {
        const sample = await collection.findOne();
        console.log(`   📄 Sample document keys: ${Object.keys(sample).join(', ')}`);
        if (sample.name) console.log(`   📝 Name: ${sample.name}`);
        if (sample.title) console.log(`   📝 Title: ${sample.title}`);
        if (sample.email) console.log(`   📧 Email: ${sample.email}`);
        if (sample.status) console.log(`   🏷️  Status: ${sample.status}`);
        console.log(`   📅 Created: ${sample.createdAt || sample._id ? new Date(sample._id.getTimestamp()) : 'N/A'}`);
      }
      console.log('');
    }
    
    console.log('✅ Complete database scan finished!');
    
  } catch (error) {
    console.error('❌ Error scanning database:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllCollections(); 