import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MentorCard from "@/components/MentorCard";
import { apiGet } from "@/lib/api";
import type { AvailabilityStatus, MentorListItem } from "@/types/api";

const expertiseOptions = [
  "All Areas",
  "Machine Learning",
  "Python",
  "Distributed Systems",
  "Software Architecture",
  "Agile",
  "Career Guidance",
  "Cybersecurity",
  "Cryptography",
  "Research Methods",
  "Product Management",
  "Entrepreneurship",
  "UX Design",
  "Data Science",
  "Statistics",
  "Web Development",
  "Cloud",
  "DevOps",
];

const availabilityOptions: ("all" | AvailabilityStatus)[] = ["all", "available", "busy", "offline"];

export default function MentorsList() {
  const [search, setSearch] = useState("");
  const [expertise, setExpertise] = useState("All Areas");
  const [availability, setAvailability] = useState<"all" | AvailabilityStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentors, setMentors] = useState<MentorListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        params.set("limit", "100");
        if (search.trim()) params.set("q", search.trim());
        if (expertise !== "All Areas") params.set("expertise", expertise);
        if (availability !== "all") params.set("availability_status", availability);

        const data = (await apiGet(`/mentors?${params.toString()}`)) as {
          items: MentorListItem[];
        };
        if (!cancelled) {
          setMentors(data.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load mentors.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [search, expertise, availability]);

  const filteredCount = mentors.length;
  const selectClass =
    "px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow appearance-none pr-8 cursor-pointer";

  const availabilityLabel = useMemo(
    () => ({
      all: "All",
      available: "Available",
      busy: "Busy",
      offline: "Offline",
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Find a Mentor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredCount} mentor{filteredCount !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or expertise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>

          <div className="relative">
            <select
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              className={selectClass}
            >
              {expertiseOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as "all" | AvailabilityStatus)}
              className={selectClass}
            >
              {availabilityOptions.map((o) => (
                <option key={o} value={o}>
                  {availabilityLabel[o]}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading mentors...</p>}
        {error && !loading && (
          <div className="border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && filteredCount === 0 ? (
          <div className="border border-border rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground">No mentors match your filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setExpertise("All Areas");
                setAvailability("all");
              }}
              className="mt-3 text-sm text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : null}

        {!loading && !error && filteredCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

