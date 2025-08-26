import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { registerSchema, loginSchema } from '../schemas/auth';
import { env } from '../config/env';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, displayName } = registerSchema.parse(req.body);
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'email exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, displayName });
  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret);
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, env.jwtSecret);
  res.json({ token });
});

export default router;
