/**
 * Browser origins allowed for CORS (Express) and Socket.IO during local dev + FRONTEND_URL in prod.
 */
export function getAllowedOrigins() {
  const origins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
  ];
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  return origins;
}
