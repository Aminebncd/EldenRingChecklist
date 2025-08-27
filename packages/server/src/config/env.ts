import 'dotenv/config';

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/eldenring',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  PORT: Number(process.env.PORT || 4000)
};
