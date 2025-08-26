import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import items from './routes/items';
import auth from './routes/auth';
import progress from './routes/progress';

export const app = express();
app.use(cors());
app.use(express.json());

app.use('/items', items);
app.use('/auth', auth);
app.use('/progress', progress);

export async function start() {
  await mongoose.connect(env.mongodbUri);
  return app.listen(env.port, () => {
    console.log(`server on ${env.port}`);
  });
}

if (require.main === module) {
  start();
}
