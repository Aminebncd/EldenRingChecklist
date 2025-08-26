/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, test, expect, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../index';
import ChecklistItem from '../models/ChecklistItem';
import User from '../models/User';

beforeEach(() => {
  vi.restoreAllMocks();
});

test('GET /items', async () => {
  vi.spyOn(ChecklistItem, 'find').mockReturnValue({
    sort: () => Promise.resolve([
      { slug: 'a', title: 'A' },
      { slug: 'b', title: 'B' },
      { slug: 'c', title: 'C' },
    ]),
  } as any);
  const res = await request(app).get('/items');
  expect(res.status).toBe(200);
  expect(res.body.length).toBe(3);
});

test('POST /auth/login', async () => {
  const passwordHash = await bcrypt.hash('test1234', 10);
  vi.spyOn(User, 'findOne').mockResolvedValue({ id: '1', passwordHash, role: 'user' } as any);
  const res = await request(app).post('/auth/login').send({ email: 'test@local', password: 'test1234' });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
});
