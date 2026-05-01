import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/synapsecode-servicegit';
    await mongoose.connect(mongoURL);
    console.log('- MongoDB conectada en SynapseCode-ServiceGit');
  } catch (error) {
    console.error('ERROR: Error conectando MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
