const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/infogram';

async function testAdminLogin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the AdminCredentials model
    const AdminCredentials = mongoose.model('AdminCredentials', new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String,
      permissions: [String],
      isActive: Boolean,
      failedAttempts: Number,
      lockedUntil: Date
    }));

    // List all admin credentials
    const admins = await AdminCredentials.find({});
    console.log('\n📋 Found admin accounts:');
    admins.forEach(admin => {
      console.log(`- ${admin.username} (${admin.email}) - Role: ${admin.role} - Active: ${admin.isActive}`);
    });

    // Test login with known credentials
    const testCredentials = [
      { email: 'zyrachains@gmail.com', password: 'superpassword' },
      { email: 'admin@infogram.com', password: 'adminpassword' },
      { email: 'editor@infogram.com', password: 'editorpassword' }
    ];

    console.log('\n🔐 Testing login credentials:');
    
    for (const cred of testCredentials) {
      const admin = await AdminCredentials.findOne({ email: cred.email, isActive: true });
      
      if (!admin) {
        console.log(`❌ ${cred.email}: Admin not found or inactive`);
        continue;
      }

      const isValidPassword = await bcrypt.compare(cred.password, admin.password);
      
      if (isValidPassword) {
        console.log(`✅ ${cred.email}: Login successful`);
      } else {
        console.log(`❌ ${cred.email}: Invalid password`);
      }
    }

    // Create a new test admin if needed
    console.log('\n🔧 Creating test admin account...');
    const testAdmin = await AdminCredentials.findOne({ email: 'test@admin.com' });
    
    if (!testAdmin) {
      const hashedPassword = await bcrypt.hash('test123456', 12);
      await AdminCredentials.create({
        username: 'testadmin',
        email: 'test@admin.com',
        password: hashedPassword,
        role: 'super_admin',
        permissions: ['manage_users', 'manage_blog', 'view_analytics'],
        isActive: true,
        failedAttempts: 0
      });
      console.log('✅ Created test admin: test@admin.com / test123456');
    } else {
      console.log('ℹ️  Test admin already exists: test@admin.com / test123456');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAdminLogin(); 