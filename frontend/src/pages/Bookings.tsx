import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { toast } from "sonner";
import type { AvailabilitySlot, Booking } from "@/types/api";

const statusColor: Record<string, string> = {
  confirmed: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-muted-foreground bg-secondary border-border",
  completed: "text-red-700 bg-red-50 border-red-200 dark:text-red-200 dark:bg-red-950/50 dark:border-red-900",
  no_show: "text-amber-600 bg-amber-50 border-amber-200",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatTimeRange(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return "—";
  return `${new Date(startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}–${new Date(endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

/** Messaging is allowed only during the booked slot (same rules as the chat server). */
function isInScheduledSessionWindow(booking: Booking): boolean {
  if (booking.status !== "confirmed" || !booking.startAt || !booking.endAt) return false;
  const now = Date.now();
  const start = new Date(booking.startAt).getTime();
  const end = new Date(booking.endAt).getTime();
  return now >= start && now <= end;
}

export default function Bookings() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role || "student";
  const isMentor = role === "mentor";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSlot, setNewSlot] = useState({ date: "", startTime: "", endTime: "" });
  const [slotError, setSlotError] = useState("");
  const [slotSaving, setSlotSaving] = useState(false);
  const [slotDeletingId, setSlotDeletingId] = useState<string | null>(null);
  const [messageBookingId, setMessageBookingId] = useState<string | null>(null);
  /** Bumps on an interval so the Message button enables when the session window starts. */
  const [sessionWindowClock, setSessionWindowClock] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSessionWindowClock((c) => c + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const bookingsRes = (await apiGet("/bookings/mine")) as { items: Booking[] };
      setBookings(bookingsRes.items || []);

      if (isMentor) {
        const slotsRes = (await apiGet("/availability/slots")) as { items: AvailabilitySlot[] };
        setSlots(slotsRes.items || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isMentor]);

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [slots]
  );

  const field =
    "px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlotError("");
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      setSlotError("All fields are required.");
      return;
    }
    if (newSlot.startTime >= newSlot.endTime) {
      setSlotError("End time must be after start time.");
      return;
    }

    setSlotSaving(true);
    try {
      await apiPost("/availability/slots", {
        startAt: toIsoDateTime(newSlot.date, newSlot.startTime),
        endAt: toIsoDateTime(newSlot.date, newSlot.endTime),
      });
      setNewSlot({ date: "", startTime: "", endTime: "" });
      await load();
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : "Failed to create slot.");
    } finally {
      setSlotSaving(false);
    }
  };

  const openChatWithOtherParty = async (booking: Booking) => {
    if (booking.status !== "confirmed") return;
    const participantId = isMentor ? booking.studentId : booking.mentorId;
    setMessageBookingId(booking.id);
    try {
      const data = (await apiPost("/chat/conversations/direct", {
        participantId,
      })) as { conversationId: string };
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open chat.");
    } finally {
      setMessageBookingId(null);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setSlotDeletingId(slotId);
    setSlotError("");
    try {
      await apiDelete(`/availability/slots/${slotId}`);
      await load();
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : "Failed to delete slot.");
    } finally {
      setSlotDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground mb-6">Loading...</p> : null}
        {error ? <p className="text-sm text-destructive mb-6">{error}</p> : null}

        <div className="mb-10">
          {!loading && bookings.length === 0 ? (
            <div className="border border-border rounded-lg p-10 text-center">
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      {isMentor ? "Student" : "Mentor"}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Chat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((b) => {
                    const inSessionWindow = isInScheduledSessionWindow(b);
                    const canMessageFromBooking =
                      b.status === "confirmed" && inSessionWindow && messageBookingId !== b.id;
                    return (
                    <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {isMentor ? b.studentName : b.mentorName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(b.startAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTimeRange(b.startAt, b.endAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            statusColor[b.status] || "text-muted-foreground bg-secondary border-border"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={!canMessageFromBooking}
                          onClick={() => void openChatWithOtherParty(b)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-border bg-background hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            b.status !== "confirmed"
                              ? "Chat is available for confirmed bookings"
                              : !inSessionWindow
                                ? "Messaging is only available during your booked session time"
                                : "Open direct messages with your booking partner"
                          }
                        >
                          <MessageCircle size={12} />
                          {messageBookingId === b.id ? "Opening…" : "Message"}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isMentor && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">My Availability Slots</h2>
            <div className="border border-border rounded-lg p-5 mb-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Add New Slot</h3>
              <form onSubmit={handleAddSlot} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date</label>
                  <input
                    type="date"
                    className={field}
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Time</label>
                  <input
                    type="time"
                    className={field}
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Time</label>
                  <input
                    type="time"
                    className={field}
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={slotSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Plus size={14} />
                  {slotSaving ? "Adding..." : "Add Slot"}
                </button>
              </form>
              {slotError && <p className="mt-2 text-xs text-destructive">{slotError}</p>}
            </div>

            {sortedSlots.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">No slots yet. Add one above.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedSlots.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-foreground">{formatDate(s.startAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(s.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(s.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                              s.isBooked
                                ? "text-amber-600 bg-amber-50 border-amber-200"
                                : "text-green-600 bg-green-50 border-green-200"
                            }`}
                          >
                            {s.isBooked ? "Booked" : "Open"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => void handleDeleteSlot(s.id)}
                            disabled={s.isBooked || slotDeletingId === s.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                            {slotDeletingId === s.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

