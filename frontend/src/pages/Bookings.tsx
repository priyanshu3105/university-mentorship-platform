import { useState } from "react";
import { Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { currentUser, bookings, timeSlots, mentors } from "@/data/mockData";

const statusColor: Record<string, string> = {
  Confirmed: "text-green-600 bg-green-50 border-green-200",
  Cancelled: "text-muted-foreground bg-secondary border-border",
  Pending: "text-amber-600 bg-amber-50 border-amber-200",
};

export default function Bookings() {
  const role = currentUser.role;
  const isMentor = role === "mentor";
  const myMentorId = mentors.find((m) => m.email === currentUser.email)?.id;

  const myBookings = bookings.filter((b) =>
    isMentor ? b.mentorId === myMentorId : b.studentId === currentUser.id
  );

  const mySlots = timeSlots.filter((s) => s.mentorId === myMentorId);

  const [newSlot, setNewSlot] = useState({ date: "", startTime: "", endTime: "" });
  const [slots, setSlots] = useState(mySlots);
  const [slotError, setSlotError] = useState("");

  const field =
    "px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      setSlotError("All fields are required.");
      return;
    }
    if (newSlot.startTime >= newSlot.endTime) {
      setSlotError("End time must be after start time.");
      return;
    }
    setSlotError("");
    const slot = {
      id: `ts-new-${Date.now()}`,
      mentorId: myMentorId ?? "",
      date: newSlot.date,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      booked: false,
    };
    setSlots((prev) => [...prev, slot]);
    setNewSlot({ date: "", startTime: "", endTime: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">My Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {myBookings.length} booking{myBookings.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Bookings table */}
        <div className="mb-10">
          {myBookings.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {isMentor ? b.studentName : b.mentorName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{b.date}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.startTime}–{b.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor[b.status]}`}>
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

        {/* Mentor: Availability Slots */}
        {isMentor && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">My Availability Slots</h2>

            {/* Add slot form */}
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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                  Add Slot
                </button>
              </form>
              {slotError && <p className="mt-2 text-xs text-destructive">{slotError}</p>}
            </div>

            {slots.length === 0 ? (
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {slots.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-foreground">{s.date}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.startTime}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.endTime}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                              s.booked
                                ? "text-amber-600 bg-amber-50 border-amber-200"
                                : "text-green-600 bg-green-50 border-green-200"
                            }`}
                          >
                            {s.booked ? "Booked" : "Open"}
                          </span>
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
