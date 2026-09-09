require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkBlogPosts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const BlogPost = require('./lib/models/BlogPost').default;
    const User = require('./lib/models/User').default;
    
    console.log('\n📝 Checking Blog Posts...');
    const posts = await BlogPost.find({}).populate('author', 'piUsername role bio avatar');
    
    console.log(`Found ${posts.length} blog posts:`);
    posts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.title}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Author: ${post.author ? post.author.piUsername || 'Unknown' : 'No author'}`);
      console.log(`   Author avatar: ${post.author?.avatar || 'No avatar'}`);
      console.log(`   Categories: ${post.categories?.length || 0}`);
      console.log(`   Tags: ${post.tags?.length || 0}`);
    });
    
    console.log('\n👥 Checking Users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.piUsername || 'Unknown'}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Avatar: ${user.avatar || 'No avatar'}`);
      console.log(`   UID: ${user.user_uid}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBlogPosts(); 