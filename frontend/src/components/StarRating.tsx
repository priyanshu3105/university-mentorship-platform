import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
}

export default function StarRating({ rating, count, size = 14 }: StarRatingProps) {
  const full = Math.floor(rating);
  const partial = rating - full;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < full
                ? "fill-amber-400 text-amber-400"
                : i === full && partial >= 0.5
                ? "fill-amber-200 text-amber-400"
                : "fill-gray-100 text-gray-300"
            }
          />
        ))}
      </div>
      <span className="text-sm text-foreground font-medium">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
