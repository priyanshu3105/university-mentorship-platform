import { useState } from "react";
import Navbar from "@/components/Navbar";
import { pendingMentors as initialPending, reviewsForModeration as initialReviews } from "@/data/mockData";

export default function Admin() {
  const [pending, setPending] = useState(initialPending);
  const [reviews, setReviews] = useState(initialReviews);
  const [tab, setTab] = useState<"mentors" | "reviews">("mentors");

  const handleApprove = (id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const handleHide = (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, hidden: true } : r)));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container py-6 sm:py-8 lg:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pending mentors and review moderation.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border border-border rounded-lg p-1 w-fit mb-6 sm:mb-8">
          <button
            onClick={() => setTab("mentors")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "mentors"
                ? "bg-background shadow-sm text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Mentors
            {pending.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "reviews"
                ? "bg-background shadow-sm text-foreground border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Review Moderation
            {reviews.filter((r) => !r.hidden).length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs border border-destructive/20">
                {reviews.filter((r) => !r.hidden).length}
              </span>
            )}
          </button>
        </div>

        {/* Pending Mentors */}
        {tab === "mentors" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Pending Mentor Approvals</h2>
            {pending.length === 0 ? (
              <div className="border border-border rounded-lg p-10 text-center">
                <p className="text-sm text-muted-foreground">No pending mentor applications.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Registered</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pending.map((p) => (
                      <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.email}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{p.registeredDate}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                          >
                            Approve
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

        {/* Review Moderation */}
        {tab === "reviews" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Review Moderation</h2>
            {reviews.filter((r) => !r.hidden).length === 0 ? (
              <div className="border border-border rounded-lg p-10 text-center">
                <p className="text-sm text-muted-foreground">No flagged reviews to moderate.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mentor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Comment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reviews
                      .filter((r) => !r.hidden)
                      .map((r) => (
                        <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{r.mentorName}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.studentName}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.rating}/5</td>
                          <td className="px-4 py-3 text-muted-foreground max-w-xs">
                            <span className="line-clamp-2">{r.comment}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.date}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleHide(r.id)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors whitespace-nowrap"
                            >
                              Hide
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
