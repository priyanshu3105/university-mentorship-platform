import { jest } from '@jest/globals';

const mockGetUser = jest.fn();
const mockGetUserById = jest.fn();
const mockFrom = jest.fn();
const mockRpc = jest.fn();
const mockSendBookingConfirmationEmails = jest.fn();

jest.unstable_mockModule('../config/supabaseClient.js', () => ({
  supabaseAdmin: {
    auth: {
      getUser: mockGetUser,
      admin: {
        getUserById: mockGetUserById,
      },
    },
    from: mockFrom,
    rpc: mockRpc,
  },
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
  sendBookingConfirmationEmails: mockSendBookingConfirmationEmails,
}));

const { app } = await import('../app.js');
const request = (await import('supertest')).default;

function makeBuilder({ data = null, error = null } = {}) {
  const result = { data, error };
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

function mockAuthedUser({ id = 'user-1', email = 'user@example.com' } = {}) {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id,
        email,
        email_confirmed_at: '2026-01-01T00:00:00.000Z',
      },
    },
    error: null,
  });
}

beforeEach(() => {
  mockGetUser.mockReset();
  mockGetUserById.mockReset();
  mockFrom.mockReset();
  mockRpc.mockReset();
  mockSendBookingConfirmationEmails.mockReset();
  mockAuthedUser();
});

describe('Profile + mentor discovery APIs', () => {
  it('GET /api/profiles/me returns base profile', async () => {
    const profileChain = makeBuilder({
      data: {
        id: 'user-1',
        full_name: 'Alice Student',
        role: 'student',
        created_at: '2026-01-10T12:00:00Z',
        updated_at: '2026-01-10T12:00:00Z',
      },
    });
    mockFrom.mockImplementation(() => profileChain);

    const res = await request(app)
      .get('/api/profiles/me')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Alice Student');
    expect(res.body.role).toBe('student');
  });

  it('GET /api/students/me requires student role and returns student profile', async () => {
    const roleChain = makeBuilder({ data: { role: 'student' } });
    const studentChain = makeBuilder({
      data: {
        user_id: 'user-1',
        course_program: 'BSc CS',
        interests: ['AI', 'Security'],
        created_at: '2026-01-10T12:00:00Z',
        updated_at: '2026-01-10T12:00:00Z',
      },
    });

    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return roleChain;
      if (table === 'student_profiles') return studentChain;
      return makeBuilder();
    });

    const res = await request(app)
      .get('/api/students/me')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.courseProgram).toBe('BSc CS');
    expect(res.body.interests).toEqual(['AI', 'Security']);
  });

  it('GET /api/mentors applies approval filter', async () => {
    const mentorsChain = makeBuilder({
      data: [
        {
          user_id: 'mentor-1',
          bio: 'Mentor bio',
          expertise: ['AI'],
          availability_status: 'available',
          photo_url: null,
          average_rating: 4.7,
          rating_count: 12,
          is_approved: true,
          user_profiles: { full_name: 'Dr. Approved Mentor' },
        },
      ],
    });

    mockFrom.mockImplementation((table) => {
      if (table === 'mentor_profiles') return mentorsChain;
      return makeBuilder();
    });

    const res = await request(app)
      .get('/api/mentors')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(mentorsChain.eq).toHaveBeenCalledWith('is_approved', true);
    expect(res.body.items).toHaveLength(1);
  });
});

describe('Booking + email + concurrency behavior', () => {
  it('POST /api/bookings creates booking and sends confirmation email', async () => {
    const roleChain = makeBuilder({ data: { role: 'student' } });
    const bookingReadChain = makeBuilder({
      data: {
        id: 'booking-1',
        slot_id: 'slot-1',
        mentor_id: 'mentor-1',
        student_id: 'user-1',
        status: 'confirmed',
        created_at: '2026-05-01T09:00:00Z',
        cancelled_at: null,
        availability_slots: {
          start_at: '2026-05-10T10:00:00Z',
          end_at: '2026-05-10T10:50:00Z',
        },
      },
    });
    const usersChain = makeBuilder({
      data: [
        { id: 'mentor-1', full_name: 'Mentor Name', role: 'mentor' },
        { id: 'user-1', full_name: 'Student Name', role: 'student' },
      ],
    });

    const userProfilesDispatcher = {
      select: jest.fn((columns) => {
        if (columns === 'role') return roleChain;
        return usersChain;
      }),
    };
    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return userProfilesDispatcher;
      if (table === 'bookings') return bookingReadChain;
      return makeBuilder();
    });
    mockRpc.mockResolvedValue({ data: { id: 'booking-1' }, error: null });
    mockGetUserById.mockImplementation(async (id) => ({
      data: { user: { id, email: `${id}@example.com` } },
      error: null,
    }));

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer token')
      .send({ slotId: 'slot-1' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('booking-1');
    expect(mockSendBookingConfirmationEmails).toHaveBeenCalledTimes(1);
  });

  it('POST /api/bookings returns 409 on second concurrent attempt', async () => {
    const roleChain = makeBuilder({ data: { role: 'student' } });
    const bookingReadChain = makeBuilder({
      data: {
        id: 'booking-2',
        slot_id: 'slot-2',
        mentor_id: 'mentor-2',
        student_id: 'user-1',
        status: 'confirmed',
        created_at: '2026-05-01T09:00:00Z',
        cancelled_at: null,
        availability_slots: {
          start_at: '2026-05-10T10:00:00Z',
          end_at: '2026-05-10T10:50:00Z',
        },
      },
    });
    const usersChain = makeBuilder({
      data: [
        { id: 'mentor-2', full_name: 'Mentor 2', role: 'mentor' },
        { id: 'user-1', full_name: 'Student Name', role: 'student' },
      ],
    });

    const userProfilesDispatcher = {
      select: jest.fn((columns) => {
        if (columns === 'role') return roleChain;
        return usersChain;
      }),
    };
    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return userProfilesDispatcher;
      if (table === 'bookings') return bookingReadChain;
      return makeBuilder();
    });

    mockRpc
      .mockResolvedValueOnce({ data: { id: 'booking-2' }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'SLOT_ALREADY_BOOKED' },
      });
    mockGetUserById.mockResolvedValue({
      data: { user: { id: 'x', email: 'x@example.com' } },
      error: null,
    });

    const first = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer token')
      .send({ slotId: 'slot-2' });
    const second = await request(app)
      .post('/api/bookings')
      .set('Authorization', 'Bearer token')
      .send({ slotId: 'slot-2' });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });
});

describe('Chat ownership + ordering', () => {
  it('GET /api/chat/conversations/:id/messages blocks non-members', async () => {
    const membershipChain = makeBuilder({ data: null });
    mockFrom.mockImplementation((table) => {
      if (table === 'conversation_members') return membershipChain;
      return makeBuilder();
    });

    const res = await request(app)
      .get('/api/chat/conversations/c1/messages')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
  });

  it('GET /api/chat/conversations/:id/messages returns chronological order', async () => {
    const membershipChain = makeBuilder({
      data: {
        conversation_id: 'c1',
        user_id: 'user-1',
        role: 'member',
        joined_at: '2026-01-01T00:00:00Z',
        left_at: null,
      },
    });
    const messagesChain = makeBuilder({
      data: [
        {
          id: 'm-new',
          conversation_id: 'c1',
          sender_id: 'user-1',
          content: 'second',
          created_at: '2026-02-02T11:00:00Z',
          updated_at: '2026-02-02T11:00:00Z',
        },
        {
          id: 'm-old',
          conversation_id: 'c1',
          sender_id: 'user-1',
          content: 'first',
          created_at: '2026-02-02T10:00:00Z',
          updated_at: '2026-02-02T10:00:00Z',
        },
      ],
    });

    mockFrom.mockImplementation((table) => {
      if (table === 'conversation_members') return membershipChain;
      if (table === 'messages') return messagesChain;
      return makeBuilder();
    });

    const res = await request(app)
      .get('/api/chat/conversations/c1/messages')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(200);
    expect(res.body.items.map((m) => m.id)).toEqual(['m-old', 'm-new']);
  });
});

describe('Reviews + admin auth behavior', () => {
  it('POST /api/reviews enforces rating bounds', async () => {
    const roleChain = makeBuilder({ data: { role: 'student' } });
    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return roleChain;
      return makeBuilder();
    });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token')
      .send({ mentorId: 'mentor-1', rating: 6, comment: 'Too high' });

    expect(res.status).toBe(400);
  });

  it('POST /api/reviews blocks access when eligibility check fails', async () => {
    const roleChain = makeBuilder({ data: { role: 'student' } });
    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return roleChain;
      return makeBuilder();
    });
    mockRpc.mockResolvedValue({
      data: false,
      error: null,
    });

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', 'Bearer token')
      .send({ mentorId: 'mentor-1', rating: 4, comment: 'Good' });

    expect(res.status).toBe(403);
  });

  it('GET /api/admin/reviews returns 403 for non-admin users', async () => {
    const roleChain = makeBuilder({ data: { role: 'student' } });
    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return roleChain;
      return makeBuilder();
    });

    const res = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', 'Bearer token');

    expect(res.status).toBe(403);
  });

  it('POST /api/admin/reviews/:id/hide hides review for admin users', async () => {
    const adminRoleChain = makeBuilder({ data: { role: 'admin' } });
    const reviewUpdateChain = makeBuilder({
      data: {
        id: 'review-1',
        is_visible: false,
        hidden_at: '2026-05-03T12:00:00Z',
        hidden_by: 'user-1',
        hide_reason: 'Policy violation',
      },
    });
    const moderationInsertChain = makeBuilder({ data: null, error: null });

    mockFrom.mockImplementation((table) => {
      if (table === 'user_profiles') return adminRoleChain;
      if (table === 'reviews') return reviewUpdateChain;
      if (table === 'review_moderation_actions') return moderationInsertChain;
      return makeBuilder();
    });

    const res = await request(app)
      .post('/api/admin/reviews/review-1/hide')
      .set('Authorization', 'Bearer token')
      .send({ reason: 'Policy violation' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('review-1');
    expect(res.body.isVisible).toBe(false);
  });
});
