import { useState } from "react";
import Navbar from "@/components/Navbar";
import { currentUser, mentors } from "@/data/mockData";

export default function Profile() {
  const role = currentUser.role;
  const isMentor = role === "mentor";
  const mentorData = mentors.find((m) => m.email === currentUser.email);

  const [form, setForm] = useState({
    fullName: currentUser.name,
    email: currentUser.email,
    bio: mentorData?.bio ?? "",
    expertise: mentorData?.expertise.join(", ") ?? "",
    availability: mentorData?.availability ?? "Available",
    photoUrl: "",
    course: "BSc Computer Science",
    interests: "Machine Learning, Open Source, Cybersecurity",
  });
  const [saved, setSaved] = useState(false);

  const field =
    "block w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const roleBadge = isMentor
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-secondary text-muted-foreground border-border";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="page-container-narrow py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-semibold">
            {currentUser.avatarInitials}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{currentUser.name}</h1>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border mt-1.5 ${roleBadge}`}>
              {isMentor ? "Mentor" : "Student"}
            </span>
          </div>
        </div>

        <div className="border border-border rounded-lg p-4 sm:p-6">
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

            {!isMentor && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Course / Program</label>
                  <input
                    type="text"
                    className={field}
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
