import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import ExpertiseTag from "@/components/ExpertiseTag";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { AvailabilitySlot, MentorListItem, MentorReview } from "@/types/api";

function formatDateTime(value: string) {
  const dt = new Date(value);
  return {
    date: dt.toLocaleDateString(),
    time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function MentorDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const [mentor, setMentor] = useState<MentorListItem | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: "5", comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [mentorData, reviewData] = await Promise.all([
        apiGet(`/mentors/${id}`) as Promise<{ mentor: MentorListItem; slots: AvailabilitySlot[] }>,
        apiGet(`/mentors/${id}/reviews`) as Promise<{ items: MentorReview[] }>,
      ]);

      setMentor(mentorData.mentor);
      setSlots(mentorData.slots || []);
      setReviews(reviewData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load mentor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const canReview = profile?.role === "student";
  const sortedSlots = useMemo(
    () =>
      [...slots].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [slots]
  );

  const handleBook = async (slotId: string) => {
    setBookingLoading(slotId);
    setBookingError("");
    try {
      await apiPost("/bookings", { slotId });
      await load();
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setBookingLoading(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor?.id) return;
    setReviewError("");
    setReviewSaving(true);

    try {
      await apiPost("/reviews", {
        mentorId: mentor.id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setReviewForm({ rating: "5", comment: "" });
      await load();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setReviewSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20">
          <p className="text-sm text-muted-foreground">Loading mentor details...</p>
        </div>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-sm">{error || "Mentor not found."}</p>
          <Link to="/mentors" className="text-primary text-sm font-medium hover:underline mt-3 inline-block">
            Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          to="/mentors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          All Mentors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground text-base font-semibold shrink-0">
                {mentor.fullName
                  .split(" ")
                  .map((w) => w[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{mentor.fullName}</h1>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <StatusBadge status={mentor.availabilityStatus} />
                  <StarRating rating={mentor.averageRating} count={mentor.ratingCount} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio || "No bio provided."}</p>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold text-foreground mb-2">Expertise</h2>
              <div className="flex flex-wrap gap-1.5">
                {mentor.expertise.map((tag) => (
                  <ExpertiseTag key={tag} label={tag} />
                ))}
              </div>
            </div>

            {canReview && (
              <div className="mt-10 border border-border rounded-lg p-4">
                <h2 className="text-base font-semibold text-foreground mb-3">Leave a review</h2>
                <form onSubmit={handleSubmitReview} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rating</label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                      className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                    >
                      {["5", "4", "3", "2", "1"].map((r) => (
                        <option key={r} value={r}>
                          {r}/5
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Comment</label>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
                      placeholder="Share your mentorship experience..."
                    />
                  </div>
                  {reviewError && <p className="text-xs text-destructive">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewSaving}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {reviewSaving ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-10">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Reviews <span className="text-muted-foreground font-normal text-sm">({reviews.length})</span>
              </h2>
              {reviews.length === 0 ? (
                <div className="border border-border rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-medium text-foreground">{review.studentName}</p>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size={12} />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="border border-border rounded-lg p-5 sticky top-20">
              <h2 className="text-sm font-semibold text-foreground mb-4">Available Slots</h2>
              {bookingError && <p className="text-xs text-destructive mb-3">{bookingError}</p>}
              {sortedSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available slots right now.</p>
              ) : (
                <div className="space-y-2">
                  {sortedSlots.map((slot) => {
                    const dt = formatDateTime(slot.startAt);
                    const end = formatDateTime(slot.endAt);
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between border border-border rounded-md px-3 py-2.5"
                      >
                        <div>
                          <p className="text-xs font-medium text-foreground">{dt.date}</p>
                          <p className="text-xs text-muted-foreground">
                            {dt.time} – {end.time}
                          </p>
                        </div>
                        <button
                          onClick={() => void handleBook(slot.id)}
                          disabled={bookingLoading === slot.id}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {bookingLoading === slot.id ? "Booking..." : "Book"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

