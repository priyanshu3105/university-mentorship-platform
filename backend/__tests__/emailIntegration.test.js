import { jest } from '@jest/globals';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: mockCreateTransport,
  },
}));

const { sendBookingConfirmationEmails } = await import('../services/emailService.js');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SMTP_HOST = 'smtp.example.com';
  process.env.SMTP_PORT = '587';
  process.env.SMTP_USER = 'smtp-user';
  process.env.SMTP_PASS = 'smtp-pass';
  process.env.EMAIL_FROM = 'MentorConnect <no-reply@example.com>';
  process.env.BOOKING_ATTACH_ICS = 'true';
});

describe('sendBookingConfirmationEmails', () => {
  it('sends email with ICS attachment when SMTP is configured', async () => {
    await sendBookingConfirmationEmails({
      bookingId: 'booking-1',
      mentorEmail: 'mentor@example.com',
      studentEmail: 'student@example.com',
      mentorName: 'Mentor',
      studentName: 'Student',
      startAtIso: '2026-05-10T10:00:00Z',
      endAtIso: '2026-05-10T10:50:00Z',
    });

    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const payload = mockSendMail.mock.calls[0][0];
    expect(payload.to).toContain('mentor@example.com');
    expect(payload.to).toContain('student@example.com');
    expect(payload.attachments).toHaveLength(1);
    expect(payload.attachments[0].filename).toMatch(/\.ics$/);
  });
});

