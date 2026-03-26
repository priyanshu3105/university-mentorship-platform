import { isUniversityEmail } from '../utils/email.js';

describe('isUniversityEmail', () => {
  it('returns true for valid @mumail.ie email', () => {
    expect(isUniversityEmail('mentor@mumail.ie')).toBe(true);
  });

  it('returns true for uppercase @MUMAIL.IE', () => {
    expect(isUniversityEmail('Mentor@MUMAIL.IE')).toBe(true);
  });

  it('returns true for mixed case @Mumail.Ie', () => {
    expect(isUniversityEmail('user@Mumail.Ie')).toBe(true);
  });

  it('returns true after trimming whitespace', () => {
    expect(isUniversityEmail('  mentor@mumail.ie  ')).toBe(true);
  });

  it('returns false for @gmail.com email', () => {
    expect(isUniversityEmail('student@gmail.com')).toBe(false);
  });

  it('returns false for @mumail.ie embedded in a different domain', () => {
    expect(isUniversityEmail('user@fake-mumail.ie.com')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isUniversityEmail('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUniversityEmail(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isUniversityEmail(undefined)).toBe(false);
  });

  it('returns false for a non-string value', () => {
    expect(isUniversityEmail(12345)).toBe(false);
  });
});
