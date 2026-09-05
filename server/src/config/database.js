import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 20,
    });
    logger.success(`MongoDB connected → ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDatabase = () => mongoose.connection.close();

export default connectDatabase;
