import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MentorCard from "@/components/MentorCard";
import { mentors, AvailabilityStatus } from "@/data/mockData";

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

const availabilityOptions: ("All" | AvailabilityStatus)[] = ["All", "Available", "Busy", "Offline"];

export default function MentorsList() {
  const [search, setSearch] = useState("");
  const [expertise, setExpertise] = useState("All Areas");
  const [availability, setAvailability] = useState<"All" | AvailabilityStatus>("All");

  const filtered = mentors.filter((m) => {
    const matchName = m.name.toLowerCase().includes(search.toLowerCase());
    const matchExpertise =
      expertise === "All Areas" || m.expertise.includes(expertise);
    const matchAvail = availability === "All" || m.availability === availability;
    return matchName && matchExpertise && matchAvail;
  });

  const selectClass =
    "px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow appearance-none pr-8 cursor-pointer";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Find a Mentor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} mentor{filtered.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name..."
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
              onChange={(e) => setAvailability(e.target.value as "All" | AvailabilityStatus)}
              className={selectClass}
            >
              {availabilityOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="border border-border rounded-lg p-12 text-center">
            <p className="text-sm text-muted-foreground">No mentors match your filters.</p>
            <button
              onClick={() => { setSearch(""); setExpertise("All Areas"); setAvailability("All"); }}
              className="mt-3 text-sm text-primary font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
