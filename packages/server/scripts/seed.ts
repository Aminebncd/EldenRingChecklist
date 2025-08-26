import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env';
import ChecklistItem from '../src/models/ChecklistItem';
import User from '../src/models/User';
import Progress from '../src/models/Progress';

async function seed() {
  await mongoose.connect(env.mongodbUri);
  await ChecklistItem.deleteMany({});
  await User.deleteMany({});
  await Progress.deleteMany({});

  await ChecklistItem.insertMany([
    { slug: 'great-sword', title: 'Great Sword', category: 'weapon', region: 'limgrave' },
    { slug: 'golden-seed', title: 'Golden Seed', category: 'upgrade', region: 'limgrave' },
    { slug: 'margit', title: 'Margit', category: 'boss', region: 'limgrave' },
  ]);

  const passwordHash = await bcrypt.hash('test1234', 10);
  await User.create({ email: 'test@local', passwordHash, displayName: 'Test' });

  console.log('seeded');
  await mongoose.disconnect();
}

seed();
