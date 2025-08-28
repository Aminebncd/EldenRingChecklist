import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import ChecklistItem from '../src/models/ChecklistItem.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

async function run() {
  await mongoose.connect(env.MONGODB_URI);

  const items = [
    {
      slug: 'grottes-limgrave--soldat-arbre',
      title: 'Soldat de l\u2019Arbre (Limgrave)',
      expansion: 'base',
      category: 'Boss',
      region: 'Limgrave',
      weight: 3,
      isUnique: true
    },
    {
      slug: 'grace-porte-tempete',
      title: 'Gr\u00E2ce \u2014 Porte de la temp\u00EAte',
      expansion: 'base',
      category: 'Gr\u00E2ce',
      region: 'Limgrave',
      weight: 1,
      isUnique: true
    },
    {
      slug: 'talisman-sceau-rituel',
      title: 'Talisman \u2014 Sceau rituel',
      expansion: 'base',
      category: 'Talisman',
      region: 'Liurnia',
      weight: 2,
      isUnique: true
    }
  ];

  await ChecklistItem.deleteMany({ slug: { $in: items.map((i) => i.slug) } });
  await ChecklistItem.insertMany(items);

  const email = 'test@local.dev';
  const passwordHash = await bcrypt.hash('test1234', 10);
  await User.updateOne(
    { email },
    { $set: { email, passwordHash, displayName: 'Tester', role: 'admin' } },
    { upsert: true }
  );

  console.log('[seed] ok');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
