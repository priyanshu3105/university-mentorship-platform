import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const { profile } = useAuth();

  const role = profile?.role ?? "student";
  const isMentor = role === "mentor";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    bio: "",
    expertise: "",
    availability: "Available",
    photoUrl: "",
    course: "",
    interests: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        fullName: profile.fullName || "",
        email: profile.email || "",
      }));
    }
  }, [profile]);

  const field =
    "block w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const displayName = profile?.fullName || profile?.email || "User";
  const initials = profile?.fullName ? getInitials(profile.fullName) : (profile?.email?.[0]?.toUpperCase() ?? "U");

  const roleBadge = isMentor
    ? "bg-primary/10 text-primary border-primary/20"
    : role === "admin"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-secondary text-muted-foreground border-border";

  const roleLabel = role === "admin" ? "Admin" : isMentor ? "Mentor" : "Student";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-semibold">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{displayName}</h1>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border mt-1.5 ${roleBadge}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="border border-border rounded-lg p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input
                type="text"
                className={field}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                className={`${field} opacity-60 cursor-not-allowed`}
                value={form.email}
                readOnly
              />
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            {!isMentor && role !== "admin" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Course / Program</label>
                  <input
                    type="text"
                    className={field}
                    placeholder="e.g. BSc Computer Science"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Interests</label>
                  <input
                    type="text"
                    className={field}
                    placeholder="e.g. Machine Learning, Open Source"
                    value={form.interests}
                    onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Comma-separated list of interests.</p>
                </div>
              </>
            )}

            {isMentor && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
                  <textarea
                    rows={4}
                    className={`${field} resize-none`}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Expertise</label>
                  <input
                    type="text"
                    className={field}
                    placeholder="e.g. Machine Learning, Python"
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Comma-separated list of expertise areas.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Availability Status</label>
                  <select
                    className={`${field} cursor-pointer`}
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value as typeof form.availability })}
                  >
                    <option>Available</option>
                    <option>Busy</option>
                    <option>Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Profile Photo URL</label>
                  <input
                    type="url"
                    className={field}
                    placeholder="https://example.com/photo.jpg"
                    value={form.photoUrl}
                    onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
              {saved && (
                <span className="text-xs text-green-600 font-medium">Changes saved.</span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
