import nodemailer from 'nodemailer';

let cachedTransport = null;

function isTruthy(value) {
  if (typeof value !== 'string') return Boolean(value);
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function getMailerConfig() {
  return {
    host: process.env.SMTP_HOST || null,
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: isTruthy(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.EMAIL_FROM || 'MentorConnect <no-reply@mentorconnect.local>',
  };
}

function getTransport() {
  if (cachedTransport) return cachedTransport;

  const cfg = getMailerConfig();
  if (!cfg.host || !cfg.user || !cfg.pass) {
    return null;
  }

  cachedTransport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  return cachedTransport;
}

function buildBookingIcs({
  bookingId,
  mentorName,
  studentName,
  startAtIso,
  endAtIso,
}) {
  const dtStart = new Date(startAtIso).toISOString().replace(/[-:]/g, '').replace('.000', '');
  const dtEnd = new Date(endAtIso).toISOString().replace(/[-:]/g, '').replace('.000', '');
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace('.000', '');
  const uid = `${bookingId}@mentorconnect`;
  const summary = 'MentorConnect Session';
  const description = `Mentor: ${mentorName}\\nStudent: ${studentName}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//MentorConnect//Booking//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}Z`,
    `DTSTART:${dtStart}Z`,
    `DTEND:${dtEnd}Z`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export async function sendBookingConfirmationEmails({
  bookingId,
  mentorEmail,
  studentEmail,
  mentorName,
  studentName,
  startAtIso,
  endAtIso,
}) {
  const transport = getTransport();
  if (!transport) {
    return { skipped: true, reason: 'smtp_not_configured' };
  }

  const cfg = getMailerConfig();
  const attachIcs = process.env.BOOKING_ATTACH_ICS === undefined
    ? true
    : isTruthy(process.env.BOOKING_ATTACH_ICS);

  const subject = 'Booking confirmed - MentorConnect';
  const text = [
    'Your mentorship session is confirmed.',
    '',
    `Mentor: ${mentorName}`,
    `Student: ${studentName}`,
    `Starts: ${new Date(startAtIso).toISOString()}`,
    `Ends: ${new Date(endAtIso).toISOString()}`,
  ].join('\n');

  const attachments = attachIcs
    ? [
        {
          filename: 'mentorship-session.ics',
          content: buildBookingIcs({
            bookingId,
            mentorName,
            studentName,
            startAtIso,
            endAtIso,
          }),
          contentType: 'text/calendar',
        },
      ]
    : [];

  const recipients = [mentorEmail, studentEmail].filter(Boolean);
  if (recipients.length === 0) {
    return { skipped: true, reason: 'no_recipients' };
  }

  await transport.sendMail({
    from: cfg.from,
    to: recipients.join(','),
    subject,
    text,
    attachments,
  });

  return { skipped: false };
}

