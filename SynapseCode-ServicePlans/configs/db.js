import mongoose from 'mongoose';
import config from './config.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    console.log('Connected to MongoDB:', conn.connection.host);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};

export default mongoose;
