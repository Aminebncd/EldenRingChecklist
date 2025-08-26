import { config } from 'dotenv';
config();

export const env = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/eldenring',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  port: Number(process.env.PORT) || 4000,
};
