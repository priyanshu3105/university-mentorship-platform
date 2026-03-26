import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { currentUser, bookings, timeSlots, mentors } from "@/data/mockData";
import { CalendarDays, MessageSquare, Clock, Star } from "lucide-react";

const statusColor: Record<string, string> = {
  Confirmed: "text-green-600 bg-green-50 border-green-200",
  Cancelled: "text-muted-foreground bg-secondary border-border",
  Pending: "text-amber-600 bg-amber-50 border-amber-200",
};

export default function Dashboard() {
  const role = currentUser.role;

  const myBookings = bookings.filter(
    (b) => (role === "student" ? b.studentId === currentUser.id : b.mentorId === currentUser.id)
  );

  const upcomingBookings = myBookings.filter(
    (b) => b.status === "Confirmed" && new Date(b.date) >= new Date()
  );

  const mySlots = timeSlots.filter(
    (s) => role === "mentor" && mentors.find((m) => m.email === currentUser.email)?.id === s.mentorId
  );

  const pendingSlots = mySlots.filter((s) => !s.booked);

  const myMentorData = mentors.find((m) => m.email === currentUser.email);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            Welcome back, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's an overview of your activity.
          </p>
        </div>

        {role === "student" && (
          <>
            {/* Stats */}
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
                    <p className="text-xl font-semibold text-foreground">3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mb-8">
              <Link
                to="/mentors"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                Browse Mentors
              </Link>
            </div>

            {/* Recent bookings */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Recent Bookings</h2>
              {myBookings.length === 0 ? (
                <div className="border border-border rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground">No bookings yet.</p>
                  <Link to="/mentors" className="text-sm text-primary font-medium hover:underline mt-2 inline-block">
                    Find a mentor →
                  </Link>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mentor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{b.mentorName}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.date}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.startTime}–{b.endTime}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColor[b.status]}`}>
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
            {/* Stats */}
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
                    <p className="text-xl font-semibold text-foreground">{myMentorData?.rating ?? "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mb-8">
              <Link
                to="/bookings"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                Manage Availability
              </Link>
            </div>

            {/* Upcoming sessions */}
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Upcoming Sessions</h2>
              {upcomingBookings.length === 0 ? (
                <div className="border border-border rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground">No upcoming sessions.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {upcomingBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{b.studentName}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.date}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{b.startTime}–{b.endTime}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${statusColor[b.status]}`}>
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
