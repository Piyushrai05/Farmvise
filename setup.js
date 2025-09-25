const mongoose = require('mongoose');
const { seedDatabase } = require('./utils/seedData');
require('dotenv').config();

async function setup() {
  try {
    console.log('🔧 Setting up FarmWise database...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmwise', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully!\n');
    
    // Seed database
    await seedDatabase();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Sample accounts created:');
    console.log('   Admin: admin@farmwise.com / admin123');
    console.log('   Farmer: rajesh@farmwise.com / password123');
    console.log('   Student: priya@farmwise.com / password123');
    console.log('   Farmer: amit@farmwise.com / password123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = setup;
