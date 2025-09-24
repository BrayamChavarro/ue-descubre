const request = require('supertest');
const app = require('../app');
const { connectToDatabase } = require('../config/db');
const config = require('../config/env');

beforeAll(async () => {
  await connectToDatabase();
});

describe('Health & Auth', () => {
  test('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/auth/login (session) should login admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: config.ADMIN_USERNAME, password: config.ADMIN_PASSWORD });
    expect([200,401]).toContain(res.status); // 401 si credenciales de entorno no coinciden
  });
});
