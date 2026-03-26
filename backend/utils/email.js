/**
 * Returns true if the email belongs to the university domain (@mumail.ie).
 * Case-insensitive, trims whitespace.
 */
export function isUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith('@mumail.ie');
}
