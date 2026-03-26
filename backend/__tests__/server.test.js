import { jest } from '@jest/globals';

// Mock supabaseClient so app.js can load without real env vars
jest.unstable_mockModule('../config/supabaseClient.js', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const { app } = await import('../app.js');
const request = (await import('supertest')).default;

describe('GET /health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
