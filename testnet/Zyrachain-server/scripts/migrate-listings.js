const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import the simplified models
const BusinessListing = require('../Zyrachain-lib/lib/models/BusinessListing').default;
const StartupListing = require('../Zyrachain-lib/lib/models/StartupListing').default;
const ProjectListing = require('../Zyrachain-lib/lib/models/ProjectListing').default;
const CommunityListing = require('../Zyrachain-lib/lib/models/CommunityListing').default;
const InfluencerListing = require('../Zyrachain-lib/lib/models/InfluencerListing').default;
const UpdateListing = require('../Zyrachain-lib/lib/models/UpdateListing').default;
const AdvertisingInquiry = require('../Zyrachain-lib/lib/models/AdvertisingInquiry').default;
const EcosystemCommunity = require('../Zyrachain-lib/lib/models/EcosystemCommunity').default;

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function migrateBusinessListings() {
  console.log('\n🔄 Migrating Business Listings...');
  
  try {
    // Get all existing business listings
    const existingListings = await mongoose.connection.db.collection('businesslistings').find({}).toArray();
    
    for (const listing of existingListings) {
      const simplifiedListing = {
        name: listing.businessInfo?.name || listing.name || 'Unknown Business',
        category: listing.businessInfo?.category || listing.category || 'Other',
        description: listing.businessInfo?.description || listing.description || '',
        city: listing.locationInfo?.city || listing.city || '',
        country: listing.locationInfo?.country || listing.country || '',
        email: listing.contactInfo?.email || listing.email || '',
        website: listing.contactInfo?.website || listing.website || '',
        piWalletAddress: listing.piIntegration?.piWalletAddress || listing.piWalletAddress || '',
        acceptsPiPayments: listing.piIntegration?.acceptsPiPayments || listing.acceptsPiPayments || false,
        status: listing.status || 'pending',
        submittedAt: listing.submittedAt || new Date(),
        approvedAt: listing.approvedAt || null,
        featured: listing.featured || false,
        createdAt: listing.createdAt || new Date(),
        updatedAt: listing.updatedAt || new Date()
      };

      // Update the document
      await mongoose.connection.db.collection('businesslistings').updateOne(
        { _id: listing._id },
        { $set: simplifiedListing }
      );
    }
    
    console.log(`✅ Migrated ${existingListings.length} business listings`);
  } catch (error) {
    console.error('❌ Error migrating business listings:', error);
  }
}

async function migrateStartupListings() {
  console.log('\n🔄 Migrating Startup Listings...');
  
  try {
    const existingListings = await mongoose.connection.db.collection('startuplistings').find({}).toArray();
    
    for (const listing of existingListings) {
      const simplifiedListing = {
        name: listing.projectInfo?.name || listing.name || 'Unknown Startup',
        category: listing.projectInfo?.category || listing.category || 'Other',
        description: listing.projectInfo?.description || listing.description || '',
        stage: listing.projectInfo?.stage || listing.stage || 'Idea Stage',
        email: listing.contactInfo?.email || listing.email || '',
        website: listing.links?.website || listing.website || '',
        piWalletAddress: listing.piIntegration?.walletAddress || listing.piWalletAddress || '',
        status: listing.status || 'pending',
        submittedAt: listing.submittedAt || new Date(),
        approvedAt: listing.approvedAt || null,
        featured: listing.featured || false,
        createdAt: listing.createdAt || new Date(),
        updatedAt: listing.updatedAt || new Date()
      };

      await mongoose.connection.db.collection('startuplistings').updateOne(
        { _id: listing._id },
        { $set: simplifiedListing }
      );
    }
    
    console.log(`✅ Migrated ${existingListings.length} startup listings`);
  } catch (error) {
    console.error('❌ Error migrating startup listings:', error);
  }
}

async function migrateProjectListings() {
  console.log('\n🔄 Migrating Project Listings...');
  
  try {
    const existingListings = await mongoose.connection.db.collection('projectlistings').find({}).toArray();
    
    for (const listing of existingListings) {
      const simplifiedListing = {
        projectName: listing.projectName || listing.name || 'Unknown Project',
        category: listing.category || 'Other',
        description: listing.description || '',
        email: listing.contactInfo?.email || listing.email || '',
        website: listing.links?.website || listing.website || '',
        piWalletAddress: listing.piWalletAddress || '',
        status: listing.status || 'pending',
        submittedAt: listing.submittedAt || new Date(),
        approvedAt: listing.approvedAt || null,
        featured: listing.featured || false,
        createdAt: listing.createdAt || new Date(),
        updatedAt: listing.updatedAt || new Date()
      };

      await mongoose.connection.db.collection('projectlistings').updateOne(
        { _id: listing._id },
        { $set: simplifiedListing }
      );
    }
    
    console.log(`✅ Migrated ${existingListings.length} project listings`);
  } catch (error) {
    console.error('❌ Error migrating project listings:', error);
  }
}

async function migrateCommunityListings() {
  console.log('\n🔄 Migrating Community Listings...');
  
  try {
    const existingListings = await mongoose.connection.db.collection('communitylistings').find({}).toArray();
    
    for (const listing of existingListings) {
      const simplifiedListing = {
        name: listing.name || 'Unknown Community',
        description: listing.description || '',
        category: listing.category || 'Other',
        contactEmail: listing.contactEmail || listing.email || '',
        website: listing.website || '',
        telegram: listing.socialLinks?.telegram || listing.telegram || '',
        discord: listing.socialLinks?.discord || listing.discord || '',
        status: listing.status || 'pending',
        createdAt: listing.createdAt || new Date(),
        updatedAt: listing.updatedAt || new Date()
      };

      await mongoose.connection.db.collection('communitylistings').updateOne(
        { _id: listing._id },
        { $set: simplifiedListing }
      );
    }
    
    console.log(`✅ Migrated ${existingListings.length} community listings`);
  } catch (error) {
    console.error('❌ Error migrating community listings:', error);
  }
}

async function migrateInfluencerListings() {
  console.log('\n🔄 Migrating Influencer Listings...');
  
  try {
    const existingListings = await mongoose.connection.db.collection('influencerlistings').find({}).toArray();
    
    for (const listing of existingListings) {
      const simplifiedListing = {
        name: listing.name || 'Unknown Influencer',
        bio: listing.bio || '',
        expertise: listing.expertise || 'Other',
        contactEmail: listing.contactEmail || listing.email || '',
        twitter: listing.platforms?.twitter || listing.twitter || '',
        youtube: listing.platforms?.youtube || listing.youtube || '',
        instagram: listing.platforms?.instagram || listing.instagram || '',
        status: listing.status || 'pending',
        createdAt: listing.createdAt || new Date(),
        updatedAt: listing.updatedAt || new Date()
      };

      await mongoose.connection.db.collection('influencerlistings').updateOne(
        { _id: listing._id },
        { $set: simplifiedListing }
      );
    }
    
    console.log(`✅ Migrated ${existingListings.length} influencer listings`);
  } catch (error) {
    console.error('❌ Error migrating influencer listings:', error);
  }
}

async function migrateAdvertisingInquiries() {
  console.log('\n🔄 Migrating Advertising Inquiries...');
  
  try {
    const existingInquiries = await mongoose.connection.db.collection('advertisinginquiries').find({}).toArray();
    
    for (const inquiry of existingInquiries) {
      const simplifiedInquiry = {
        companyName: inquiry.companyName || '',
        contactName: inquiry.contactName || '',
        email: inquiry.email || '',
        industry: inquiry.industry || 'Other',
        budget: inquiry.budget || '$50-100',
        campaignType: inquiry.campaignType || 'Banner Advertising',
        status: inquiry.status || 'pending',
        ipAddress: inquiry.ipAddress || '',
        userAgent: inquiry.userAgent || '',
        createdAt: inquiry.createdAt || new Date(),
        updatedAt: inquiry.updatedAt || new Date()
      };

      await mongoose.connection.db.collection('advertisinginquiries').updateOne(
        { _id: inquiry._id },
        { $set: simplifiedInquiry }
      );
    }
    
    console.log(`✅ Migrated ${existingInquiries.length} advertising inquiries`);
  } catch (error) {
    console.error('❌ Error migrating advertising inquiries:', error);
  }
}

async function migrateEcosystemCommunities() {
  console.log('\n🔄 Migrating Ecosystem Communities...');
  
  try {
    const existingCommunities = await mongoose.connection.db.collection('ecosystemcommunities').find({}).toArray();
    
    for (const community of existingCommunities) {
      const simplifiedCommunity = {
        name: community.name || 'Unknown Community',
        description: community.description || '',
        category: community.category || 'General',
        link: community.link || '',
        country: community.country || '',
        createdAt: community.createdAt || new Date(),
        updatedAt: community.updatedAt || new Date()
      };

      await mongoose.connection.db.collection('ecosystemcommunities').updateOne(
        { _id: community._id },
        { $set: simplifiedCommunity }
      );
    }
    
    console.log(`✅ Migrated ${existingCommunities.length} ecosystem communities`);
  } catch (error) {
    console.error('❌ Error migrating ecosystem communities:', error);
  }
}

async function runMigration() {
  console.log('🚀 Starting Database Migration...');
  
  await connectToDatabase();
  
  try {
    await migrateBusinessListings();
    await migrateStartupListings();
    await migrateProjectListings();
    await migrateCommunityListings();
    await migrateInfluencerListings();
    await migrateAdvertisingInquiries();
    await migrateEcosystemCommunities();
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
runMigration(); 