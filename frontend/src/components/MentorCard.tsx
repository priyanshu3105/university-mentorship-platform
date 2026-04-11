import { Link } from "react-router-dom";
import type { MentorListItem } from "@/types/api";
import StatusBadge from "./StatusBadge";
import StarRating from "./StarRating";
import ExpertiseTag from "./ExpertiseTag";

interface MentorCardProps {
  mentor: MentorListItem;
}

export default function MentorCard({ mentor }: MentorCardProps) {
  return (
    <Link
      to={`/mentors/${mentor.id}`}
      className="block border border-border rounded-lg p-5 bg-background hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground text-sm font-semibold shrink-0">
          {mentor.fullName
            .split(" ")
            .map((part) => part[0] ?? "")
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {mentor.fullName}
            </h3>
            <StatusBadge status={mentor.availabilityStatus} size="sm" />
          </div>
          <div className="mt-1">
            <StarRating rating={mentor.averageRating} count={mentor.ratingCount} size={12} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {mentor.expertise.slice(0, 3).map((tag) => (
              <ExpertiseTag key={tag} label={tag} />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
