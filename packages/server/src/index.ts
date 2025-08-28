import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { env } from './config/env.js';

import itemsRoute from './routes/items.js';
import authRoute from './routes/auth.js';
import progressRoute from './routes/progress.js';

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], credentials: false }));
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/items', itemsRoute);
app.use('/auth', authRoute);
app.use('/progress', progressRoute);

async function start() {
  await mongoose.connect(env.MONGODB_URI);
  app.listen(env.PORT, () => console.log(`[server] http://localhost:${env.PORT}`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
