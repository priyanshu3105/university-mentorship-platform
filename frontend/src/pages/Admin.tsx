import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { apiGet, apiPost } from "@/lib/api";

type PendingMentor = {
  mentorId: string;
  fullName: string;
  isApproved: boolean;
  requestedAt: string;
};

type ReviewModeration = {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  isVisible: boolean;
  hiddenAt: string | null;
  hideReason: string;
  createdAt: string;
};

export default function Admin() {
  const [pending, setPending] = useState<PendingMentor[]>([]);
  const [reviews, setReviews] = useState<ReviewModeration[]>([]);
  const [tab, setTab] = useState<"mentors" | "reviews">("mentors");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [pendingRes, reviewsRes] = await Promise.all([
        apiGet("/admin/mentors/pending") as Promise<{ items: PendingMentor[] }>,
        apiGet("/admin/reviews") as Promise<{ items: ReviewModeration[] }>,
      ]);
      setPending(pendingRes.items || []);
      setReviews(reviewsRes.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleReviews = useMemo(() => reviews.filter((r) => r.isVisible), [reviews]);

  const handleApprove = async (mentorId: string) => {
    setActionLoading(mentorId);
    try {
      await apiPost(`/admin/mentors/${mentorId}/approve`, { approved: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve mentor.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHide = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await apiPost(`/admin/reviews/${reviewId}/hide`, { reason: "Hidden by admin moderation." });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hide review.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage pending mentors and review moderation.</p>
        </div>

        {loading ? <p className="text-sm text-muted-foreground mb-4">Loading admin data...</p> : null}
        {error ? <p className="text-sm text-destructive mb-4">{error}</p> : null}

        <div className="flex gap-1 border border-border rounded-lg p-1 w-fit mb-8">
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
            {visibleReviews.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs border border-destructive/20">
                {visibleReviews.length}
              </span>
            )}
          </button>
        </div>

        {tab === "mentors" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Pending Mentor Approvals</h2>
            {pending.length === 0 ? (
              <div className="border border-border rounded-lg p-10 text-center">
                <p className="text-sm text-muted-foreground">No pending mentor applications.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Requested</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pending.map((p) => (
                      <tr key={p.mentorId} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{p.fullName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(p.requestedAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => void handleApprove(p.mentorId)}
                            disabled={actionLoading === p.mentorId}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {actionLoading === p.mentorId ? "Approving..." : "Approve"}
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

        {tab === "reviews" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Review Moderation</h2>
            {visibleReviews.length === 0 ? (
              <div className="border border-border rounded-lg p-10 text-center">
                <p className="text-sm text-muted-foreground">No visible reviews to moderate.</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Mentor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Comment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibleReviews.map((r) => (
                      <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{r.mentorName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.studentName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.rating}/5</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs">
                          <span className="line-clamp-2">{r.comment}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => void handleHide(r.id)}
                            disabled={actionLoading === r.id}
                            className="px-3 py-1.5 rounded-md text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === r.id ? "Hiding..." : "Hide"}
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

