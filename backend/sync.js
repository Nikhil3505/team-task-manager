require('dotenv').config();
const { sequelize } = require('./models');

const syncDatabase = async () => {
  try {
    console.log('Connecting to database...');
    // Only log metadata to avoid leaking credentials
    if (process.env.DATABASE_URL) {
      console.log('DATABASE_URL is present. Length:', process.env.DATABASE_URL.length);
      if (process.env.DATABASE_URL.includes(' ')) {
        console.warn('WARNING: DATABASE_URL contains spaces. This might cause issues.');
      }
    } else {
      console.log('DATABASE_URL is not set.');
    }
    await sequelize.authenticate();
    console.log('Connection established.');

    console.log('Syncing all models (creating tables)...');
    // force: false will create tables if they don't exist, but won't drop them
    await sequelize.sync({ force: false }); 
    console.log('Database synced successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
