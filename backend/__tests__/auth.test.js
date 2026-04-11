import { jest } from '@jest/globals';

// Mock supabaseAdmin before importing modules that use it
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.unstable_mockModule('../config/supabaseClient.js', () => ({
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

// Import app after mocks are in place
const { app } = await import('../app.js');
const request = (await import('supertest')).default;

// Helper: set up auth mock to return a given user
function mockAuthUser(id, email, emailConfirmed = true) {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id,
        email,
        email_confirmed_at: emailConfirmed ? '2026-01-01T00:00:00.000Z' : null,
      },
    },
    error: null,
  });
}

// Helper: set up Supabase .from().upsert().select().single() chain
function mockUpsertChain(returnData, returnError = null) {
  const chain = {
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: returnData, error: returnError }),
  };
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/complete-registration', () => {
  it('assigns role "mentor" for @mumail.ie email', async () => {
    const userId = 'aaa-bbb-ccc';
    const email = 'prof@mumail.ie';
    mockAuthUser(userId, email);

    const profileData = { id: userId, full_name: 'Prof Test', role: 'mentor' };
    const mentorData = { user_id: userId, is_approved: false };

    const profileChain = mockUpsertChain(profileData);
    const mentorChain = mockUpsertChain(mentorData);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return profileChain;
      if (table === 'mentor_profiles') return mentorChain;
    });

    const res = await request(app)
      .post('/api/auth/complete-registration')
      .set('Authorization', 'Bearer fake-token')
      .send({ fullName: 'Prof Test' });

    expect(res.status).toBe(201);
    expect(res.body.profile.role).toBe('mentor');
    expect(res.body.mentorProfile).toBeDefined();
    expect(res.body.mentorProfile.is_approved).toBe(false);

    // Verify user_profiles upsert was called with role 'mentor'
    expect(profileChain.upsert).toHaveBeenCalledWith(
      { id: userId, full_name: 'Prof Test', role: 'mentor' },
      { onConflict: 'id' }
    );
    // Verify mentor_profiles was created
    expect(mentorChain.upsert).toHaveBeenCalled();
  });

  it('assigns role "student" for non-mumail email', async () => {
    const userId = 'ddd-eee-fff';
    const email = 'student@gmail.com';
    mockAuthUser(userId, email);

    const profileData = { id: userId, full_name: 'Student Test', role: 'student' };
    const profileChain = mockUpsertChain(profileData);

    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return profileChain;
    });

    const res = await request(app)
      .post('/api/auth/complete-registration')
      .set('Authorization', 'Bearer fake-token')
      .send({ fullName: 'Student Test' });

    expect(res.status).toBe(201);
    expect(res.body.profile.role).toBe('student');
    expect(res.body.mentorProfile).toBeNull();

    // Verify user_profiles upsert was called with role 'student'
    expect(profileChain.upsert).toHaveBeenCalledWith(
      { id: userId, full_name: 'Student Test', role: 'student' },
      { onConflict: 'id' }
    );
  });

  it('returns 400 when fullName is missing', async () => {
    mockAuthUser('xxx', 'test@gmail.com');

    const res = await request(app)
      .post('/api/auth/complete-registration')
      .set('Authorization', 'Bearer fake-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fullName/i);
  });

  it('returns 403 when email is not verified', async () => {
    mockAuthUser('unverified-id', 'pending@gmail.com', false);

    const res = await request(app)
      .post('/api/auth/complete-registration')
      .set('Authorization', 'Bearer fake-token')
      .send({ fullName: 'Pending User' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/verify your email/i);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/auth/complete-registration')
      .send({ fullName: 'No Token' });

    expect(res.status).toBe(401);
  });

  it('ignores desiredRole from request body', async () => {
    const userId = 'ggg-hhh-iii';
    const email = 'student@yahoo.com';
    mockAuthUser(userId, email);

    const profileData = { id: userId, full_name: 'Sneaky User', role: 'student' };
    const profileChain = mockUpsertChain(profileData);

    mockFrom.mockImplementation(() => profileChain);

    const res = await request(app)
      .post('/api/auth/complete-registration')
      .set('Authorization', 'Bearer fake-token')
      .send({ fullName: 'Sneaky User', desiredRole: 'mentor' });

    expect(res.status).toBe(201);
    // Even though desiredRole was "mentor", a non-mumail email gets "student"
    expect(profileChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'student' }),
      expect.anything()
    );
  });
});
