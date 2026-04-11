/** Same origin in dev (Vite proxies /socket.io → backend). Set VITE_SOCKET_URL when the API lives on another host. */
export function getSocketUrl(): string {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
