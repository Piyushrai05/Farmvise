const User = require('../models/User');
const Challenge = require('../models/Challenge');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
  try {
    // Check if users already exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed');
      return;
    }

    const users = [
      {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh@farmwise.com',
        password: 'password123',
        phone: '9876543210',
        role: 'farmer',
        isEmailVerified: true,
        isPhoneVerified: true,
        preferences: {
          language: 'hi',
          theme: 'light',
          notifications: { email: true, push: true, sms: false }
        },
        location: {
          state: 'Punjab',
          district: 'Amritsar',
          village: 'Ajnala'
        },
        farmingProfile: {
          experience: 'intermediate',
          farmSize: 5,
          crops: ['wheat', 'rice', 'corn'],
          irrigationType: 'drip'
        },
        gamification: {
          level: 5,
          experience: 2500,
          points: 2500,
          badges: [
            { badgeId: '1', earnedAt: new Date(), description: 'First Steps' },
            { badgeId: '2', earnedAt: new Date(), description: 'Water Saver' }
          ],
          streak: 15
        },
        wallet: {
          balance: 2500,
          transactions: [
            { type: 'earned', amount: 100, description: 'Completed Drip Irrigation Challenge', date: new Date() },
            { type: 'earned', amount: 50, description: 'Email verification bonus', date: new Date() }
          ]
        }
      },
      {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@farmwise.com',
        password: 'password123',
        phone: '9876543211',
        role: 'student',
        isEmailVerified: true,
        isPhoneVerified: true,
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: { email: true, push: true, sms: false }
        },
        location: {
          state: 'Karnataka',
          district: 'Bangalore',
          village: 'Whitefield'
        },
        farmingProfile: {
          experience: 'beginner',
          farmSize: 2,
          crops: ['vegetables', 'herbs'],
          irrigationType: 'traditional'
        },
        gamification: {
          level: 4,
          experience: 2100,
          points: 2100,
          badges: [
            { badgeId: '1', earnedAt: new Date(), description: 'First Steps' },
            { badgeId: '3', earnedAt: new Date(), description: 'Community Helper' }
          ],
          streak: 8
        },
        wallet: {
          balance: 2100,
          transactions: [
            { type: 'earned', amount: 75, description: 'Completed Compost Challenge', date: new Date() },
            { type: 'earned', amount: 50, description: 'Email verification bonus', date: new Date() }
          ]
        }
      },
      {
        firstName: 'Amit',
        lastName: 'Patel',
        email: 'amit@farmwise.com',
        password: 'password123',
        phone: '9876543212',
        role: 'farmer',
        isEmailVerified: true,
        isPhoneVerified: true,
        preferences: {
          language: 'en',
          theme: 'light',
          notifications: { email: true, push: true, sms: true }
        },
        location: {
          state: 'Gujarat',
          district: 'Ahmedabad',
          village: 'Gandhinagar'
        },
        farmingProfile: {
          experience: 'expert',
          farmSize: 15,
          crops: ['cotton', 'groundnut', 'wheat'],
          irrigationType: 'sprinkler'
        },
        gamification: {
          level: 6,
          experience: 3200,
          points: 3200,
          badges: [
            { badgeId: '1', earnedAt: new Date(), description: 'First Steps' },
            { badgeId: '2', earnedAt: new Date(), description: 'Water Saver' },
            { badgeId: '4', earnedAt: new Date(), description: 'Solar Pioneer' }
          ],
          streak: 25
        },
        wallet: {
          balance: 3200,
          transactions: [
            { type: 'earned', amount: 200, description: 'Completed Solar Panel Challenge', date: new Date() },
            { type: 'earned', amount: 50, description: 'Email verification bonus', date: new Date() }
          ]
        }
      },
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@farmwise.com',
        password: 'admin123',
        phone: '9876543213',
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        preferences: {
          language: 'en',
          theme: 'dark',
          notifications: { email: true, push: true, sms: false }
        },
        farmingProfile: {
          experience: 'expert',
          farmSize: 0,
          crops: [],
          irrigationType: 'mixed'
        },
        gamification: {
          level: 10,
          experience: 5000,
          points: 5000,
          badges: [],
          streak: 100
        },
        wallet: {
          balance: 5000,
          transactions: []
        }
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
    }

    console.log('✅ Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

const seedChallenges = async () => {
  try {
    // Check if challenges already exist
    const existingChallenges = await Challenge.countDocuments();
    if (existingChallenges > 0) {
      console.log('Challenges already exist, skipping seed');
      return;
    }

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Admin user not found, skipping challenge seed');
      return;
    }

    const challenges = [
      {
        title: 'Drip Irrigation Setup',
        description: 'Install and use drip irrigation system for water conservation. Learn how to set up an efficient drip irrigation system that can reduce water usage by up to 50%.',
        category: 'water_conservation',
        difficulty: 'medium',
        type: 'weekly',
        points: 100,
        requirements: [
          { type: 'photo', description: 'Before and after photos of irrigation setup', required: true },
          { type: 'document', description: 'Installation checklist completion', required: true },
          { type: 'survey', description: 'Water usage survey', required: true }
        ],
        instructions: [
          {
            step: 1,
            title: 'Plan Your Layout',
            description: 'Design your drip irrigation layout considering your crop arrangement and water source location.',
            image: 'https://example.com/step1.jpg'
          },
          {
            step: 2,
            title: 'Install Main Line',
            description: 'Install the main water line from your water source to the field.',
            image: 'https://example.com/step2.jpg'
          },
          {
            step: 3,
            title: 'Install Drip Lines',
            description: 'Lay out drip lines along your crops with proper spacing.',
            image: 'https://example.com/step3.jpg'
          }
        ],
        resources: {
          videos: ['https://example.com/drip-irrigation-guide.mp4'],
          articles: ['https://example.com/drip-irrigation-benefits.pdf'],
          tools: ['Drip lines', 'Connectors', 'Timer', 'Pressure regulator'],
          tips: ['Check for leaks regularly', 'Clean filters monthly', 'Adjust pressure based on soil type']
        },
        rewards: {
          points: 100,
          badges: [
            {
              badgeId: '2',
              name: 'Water Saver',
              description: 'Successfully implemented water conservation techniques',
              icon: '💧'
            }
          ],
          discounts: [
            {
              partner: 'Irrigation Solutions Inc',
              percentage: 15,
              description: '15% off on drip irrigation equipment',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          ]
        },
        duration: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          timeLimit: 60 // 60 minutes
        },
        eligibility: {
          roles: ['farmer', 'student'],
          experience: 'beginner',
          location: {
            states: ['Punjab', 'Haryana', 'Rajasthan'],
            districts: []
          }
        },
        isActive: true,
        isFeatured: true,
        tags: ['water conservation', 'irrigation', 'sustainability'],
        createdBy: adminUser._id
      },
      {
        title: 'Compost Making Challenge',
        description: 'Create organic compost using kitchen and farm waste. Learn the art of composting to enrich your soil naturally.',
        category: 'organic_farming',
        difficulty: 'easy',
        type: 'weekly',
        points: 75,
        requirements: [
          { type: 'photo', description: 'Photos of compost pile setup', required: true },
          { type: 'document', description: 'Composting log for 2 weeks', required: true },
          { type: 'survey', description: 'Material composition survey', required: true }
        ],
        instructions: [
          {
            step: 1,
            title: 'Choose Location',
            description: 'Select a suitable location for your compost pile with good drainage.',
            image: 'https://example.com/compost-location.jpg'
          },
          {
            step: 2,
            title: 'Layer Materials',
            description: 'Alternate between green (nitrogen-rich) and brown (carbon-rich) materials.',
            image: 'https://example.com/compost-layering.jpg'
          },
          {
            step: 3,
            title: 'Maintain Moisture',
            description: 'Keep the pile moist but not soggy, and turn regularly.',
            image: 'https://example.com/compost-maintenance.jpg'
          }
        ],
        resources: {
          videos: ['https://example.com/composting-basics.mp4'],
          articles: ['https://example.com/compost-science.pdf'],
          tools: ['Compost bin', 'Pitchfork', 'Moisture meter', 'Thermometer'],
          tips: ['Mix materials well', 'Monitor temperature', 'Turn weekly', 'Avoid meat and dairy']
        },
        rewards: {
          points: 75,
          badges: [
            {
              badgeId: '5',
              name: 'Compost Master',
              description: 'Successfully created organic compost',
              icon: '🍂'
            }
          ],
          discounts: [
            {
              partner: 'Organic Gardening Store',
              percentage: 10,
              description: '10% off on composting supplies',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          ]
        },
        duration: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          timeLimit: 30
        },
        eligibility: {
          roles: ['farmer', 'student'],
          experience: 'beginner',
          location: {
            states: [],
            districts: []
          }
        },
        isActive: true,
        isFeatured: false,
        tags: ['composting', 'organic farming', 'soil health'],
        createdBy: adminUser._id
      },
      {
        title: 'Solar Panel Installation',
        description: 'Set up solar panels for renewable energy on your farm. Reduce your carbon footprint and energy costs.',
        category: 'energy_efficiency',
        difficulty: 'hard',
        type: 'monthly',
        points: 200,
        requirements: [
          { type: 'photo', description: 'Installation progress photos', required: true },
          { type: 'document', description: 'Energy consumption analysis', required: true },
          { type: 'survey', description: 'Before and after energy usage', required: true }
        ],
        instructions: [
          {
            step: 1,
            title: 'Site Assessment',
            description: 'Evaluate your site for solar potential and shading issues.',
            image: 'https://example.com/solar-assessment.jpg'
          },
          {
            step: 2,
            title: 'Installation Planning',
            description: 'Plan the installation layout and obtain necessary permits.',
            image: 'https://example.com/solar-planning.jpg'
          },
          {
            step: 3,
            title: 'Panel Installation',
            description: 'Install solar panels with proper mounting and wiring.',
            image: 'https://example.com/solar-installation.jpg'
          }
        ],
        resources: {
          videos: ['https://example.com/solar-installation-guide.mp4'],
          articles: ['https://example.com/solar-farming-benefits.pdf'],
          tools: ['Solar panels', 'Mounting hardware', 'Inverter', 'Wiring'],
          tips: ['Check local regulations', 'Consider battery storage', 'Monitor performance', 'Regular maintenance']
        },
        rewards: {
          points: 200,
          badges: [
            {
              badgeId: '4',
              name: 'Solar Pioneer',
              description: 'Successfully implemented solar energy',
              icon: '☀️'
            }
          ],
          discounts: [
            {
              partner: 'Solar Solutions Ltd',
              percentage: 20,
              description: '20% off on solar equipment',
              validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            }
          ]
        },
        duration: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          timeLimit: 120
        },
        eligibility: {
          roles: ['farmer'],
          experience: 'intermediate',
          location: {
            states: ['Gujarat', 'Rajasthan', 'Tamil Nadu'],
            districts: []
          }
        },
        isActive: true,
        isFeatured: true,
        tags: ['solar energy', 'renewable energy', 'sustainability'],
        createdBy: adminUser._id
      }
    ];

    for (const challengeData of challenges) {
      const challenge = new Challenge(challengeData);
      await challenge.save();
    }

    console.log('✅ Challenges seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding challenges:', error);
  }
};

const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');
  
  await seedUsers();
  await seedChallenges();
  
  console.log('🎉 Database seeding completed!');
};

module.exports = {
  seedDatabase,
  seedUsers,
  seedChallenges
};
