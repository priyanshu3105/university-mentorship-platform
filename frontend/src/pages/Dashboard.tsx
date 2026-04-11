import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet } from "@/lib/api";
import { CalendarDays, MessageSquare, Clock, Star } from "lucide-react";
import type { AvailabilitySlot, Booking } from "@/types/api";

const statusColor: Record<string, string> = {
  confirmed: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
  cancelled: "text-muted-foreground bg-secondary border-border",
  completed: "text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-950/50 dark:border-red-900",
  no_show: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
};

function formatTimeRange(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return "—";
  return `${new Date(startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${new Date(endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const userEmail = profile?.email || user?.email || null;
  const role = profile?.role ?? "student";
  const firstName = profile?.fullName?.split(" ")[0] || userEmail?.split("@")[0] || "there";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [activeConversations, setActiveConversations] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const tasks: Promise<unknown>[] = [
          apiGet("/bookings/mine"),
          apiGet("/chat/conversations"),
        ];
        if (role === "mentor") {
          tasks.push(apiGet("/availability/slots"));
          tasks.push(apiGet("/mentors/me"));
        }

        const results = await Promise.all(tasks);
        if (cancelled) return;

        const bookingsRes = results[0] as { items: Booking[] };
        const conversationsRes = results[1] as { items: unknown[] };
        setBookings(bookingsRes.items || []);
        setActiveConversations((conversationsRes.items || []).length);

        if (role === "mentor") {
          const slotsRes = results[2] as { items: AvailabilitySlot[] };
          const mentorRes = results[3] as { averageRating: number };
          setSlots(slotsRes.items || []);
          setAverageRating(typeof mentorRes.averageRating === "number" ? mentorRes.averageRating : null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const upcomingBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === "confirmed" &&
          b.startAt &&
          new Date(b.startAt).getTime() >= Date.now()
      ),
    [bookings]
  );

  const pendingSlots = useMemo(() => slots.filter((s) => !s.isBooked), [slots]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Here's an overview of your activity.</p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground mb-6">Loading dashboard...</p> : null}
        {error ? <p className="text-sm text-destructive mb-6">{error}</p> : null}

        {role === "student" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="border border-border rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                    <CalendarDays size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Upcoming Bookings</p>
                    <p className="text-xl font-semibold text-foreground">{upcomingBookings.length}</p>
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                    <MessageSquare size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Conversations</p>
                    <p className="text-xl font-semibold text-foreground">{activeConversations}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <Link
                to="/mentors"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                Browse Mentors
              </Link>
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Recent Bookings</h2>
              {bookings.length === 0 ? (
                <div className="border border-border rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                  <Link to="/mentors" className="text-sm text-primary font-medium hover:underline mt-2 inline-block">
                    Find a mentor →
                  </Link>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mentor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{b.mentorName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {b.startAt ? new Date(b.startAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatTimeRange(b.startAt, b.endAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[b.status] || statusColor.cancelled}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {role === "mentor" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="border border-border rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                    <CalendarDays size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Upcoming Sessions</p>
                    <p className="text-xl font-semibold text-foreground">{upcomingBookings.length}</p>
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                    <Clock size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Slots</p>
                    <p className="text-xl font-semibold text-foreground">{pendingSlots.length}</p>
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-lg p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                    <Star size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average Rating</p>
                    <p className="text-xl font-semibold text-foreground">
                      {averageRating !== null ? averageRating.toFixed(1) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <Link
                to="/bookings"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                Manage Availability
              </Link>
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Upcoming Sessions</h2>
              {upcomingBookings.length === 0 ? (
                <div className="border border-border rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {upcomingBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">{b.studentName}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {b.startAt ? new Date(b.startAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatTimeRange(b.startAt, b.endAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[b.status] || statusColor.cancelled}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {role === "admin" && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Welcome, Admin. Head to the</p>
            <Link to="/admin" className="text-primary font-medium hover:underline text-sm">
              Admin Panel →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

