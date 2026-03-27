import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import ExpertiseTag from "@/components/ExpertiseTag";
import { mentors, timeSlots, reviews } from "@/data/mockData";

export default function MentorDetail() {
  const { id } = useParams<{ id: string }>();
  const mentor = mentors.find((m) => m.id === id);

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-sm">Mentor not found.</p>
          <Link to="/mentors" className="text-primary text-sm font-medium hover:underline mt-3 inline-block">
            Back to Mentors
          </Link>
        </div>
      </div>
    );
  }

  const slots = timeSlots.filter((s) => s.mentorId === id && !s.booked);
  const mentorReviews = reviews.filter((r) => r.mentorId === id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back */}
        <Link
          to="/mentors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          All Mentors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Mentor Info */}
          <div className="lg:col-span-2">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground text-base font-semibold shrink-0">
                {mentor.avatarInitials}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{mentor.name}</h1>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <StatusBadge status={mentor.availability} />
                  <StarRating rating={mentor.rating} count={mentor.reviewCount} />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>
            </div>

            <div className="mt-5">
              <h2 className="text-sm font-semibold text-foreground mb-2">Expertise</h2>
              <div className="flex flex-wrap gap-1.5">
                {mentor.expertise.map((tag) => (
                  <ExpertiseTag key={tag} label={tag} />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-10">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Reviews{" "}
                <span className="text-muted-foreground font-normal text-sm">({mentorReviews.length})</span>
              </h2>
              {mentorReviews.length === 0 ? (
                <div className="border border-border rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mentorReviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-medium text-foreground">{review.studentName}</p>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size={12} />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Slots */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-lg p-5 sticky top-20">
              <h2 className="text-sm font-semibold text-foreground mb-4">Available Slots</h2>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No available slots right now.</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between border border-border rounded-md px-3 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-medium text-foreground">{slot.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.startTime} – {slot.endTime}
                        </p>
                      </div>
                      <button className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
