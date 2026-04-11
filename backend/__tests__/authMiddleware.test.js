import { jest } from '@jest/globals';

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.unstable_mockModule('../config/supabaseClient.js', () => ({
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

const { app } = await import('../app.js');
const request = (await import('supertest')).default;

function mockTokenUser({
  id = 'user-1',
  email = 'user@example.com',
  confirmed = true,
} = {}) {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id,
        email,
        email_confirmed_at: confirmed ? '2026-01-01T00:00:00.000Z' : null,
      },
    },
    error: null,
  });
}

function mockRoleLookup(role, error = null) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({
      data: role ? { role } : null,
      error,
    }),
  };

  mockFrom.mockImplementation((table) => {
    if (table === 'user_profiles') return chain;
    return null;
  });

  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('requireAuth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing authorization/i);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'bad token' },
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 403 when email is not verified', async () => {
    mockTokenUser({ confirmed: false });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verify your email/i);
  });
});

describe('requireRole RBAC', () => {
  it('allows student role on student-protected route', async () => {
    mockTokenUser({ id: 'student-1', email: 'student@example.com' });
    mockRoleLookup('student');

    const res = await request(app)
      .get('/api/auth/student-access')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, role: 'student' });
  });

  it('blocks non-admin users from admin route', async () => {
    mockTokenUser({ id: 'student-2', email: 'student2@example.com' });
    mockRoleLookup('student');

    const res = await request(app)
      .get('/api/auth/admin-access')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/insufficient permissions/i);
  });

  it('returns 403 when user profile role is missing', async () => {
    mockTokenUser({ id: 'unregistered', email: 'new@example.com' });
    mockRoleLookup(null);

    const res = await request(app)
      .get('/api/auth/student-access')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/complete registration/i);
  });

  it('allows admin role on admin-protected route', async () => {
    mockTokenUser({ id: 'admin-1', email: 'admin@example.com' });
    mockRoleLookup('admin');

    const res = await request(app)
      .get('/api/auth/admin-access')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, role: 'admin' });
  });
});
