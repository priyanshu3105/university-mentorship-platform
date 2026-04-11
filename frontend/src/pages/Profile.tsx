import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPut } from "@/lib/api";
import type { AvailabilityStatus, Role } from "@/types/api";

type BaseProfile = {
  id: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

type StudentProfile = {
  courseProgram: string;
  interests: string[];
};

type MentorProfile = {
  bio: string;
  expertise: string[];
  availabilityStatus: AvailabilityStatus;
  photoUrl: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Profile() {
  const { user } = useAuth();
  const userEmail = user?.email || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [base, setBase] = useState<BaseProfile | null>(null);
  const [student, setStudent] = useState<StudentProfile>({
    courseProgram: "",
    interests: [],
  });
  const [mentor, setMentor] = useState<MentorProfile>({
    bio: "",
    expertise: [],
    availabilityStatus: "offline",
    photoUrl: "",
  });

  const [fullNameInput, setFullNameInput] = useState("");
  const [courseProgramInput, setCourseProgramInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [availabilityInput, setAvailabilityInput] = useState<AvailabilityStatus>("offline");
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const baseProfile = (await apiGet("/profiles/me")) as BaseProfile;
        if (cancelled) return;

        setBase(baseProfile);
        setFullNameInput(baseProfile.fullName || "");

        if (baseProfile.role === "student") {
          const studentProfile = (await apiGet("/students/me")) as {
            courseProgram: string;
            interests: string[];
          };
          if (cancelled) return;
          setStudent({
            courseProgram: studentProfile.courseProgram || "",
            interests: studentProfile.interests || [],
          });
          setCourseProgramInput(studentProfile.courseProgram || "");
          setInterestsInput((studentProfile.interests || []).join(", "));
        }

        if (baseProfile.role === "mentor") {
          const mentorProfile = (await apiGet("/mentors/me")) as {
            bio: string;
            expertise: string[];
            availabilityStatus: AvailabilityStatus;
            photoUrl: string;
          };
          if (cancelled) return;
          setMentor({
            bio: mentorProfile.bio || "",
            expertise: mentorProfile.expertise || [],
            availabilityStatus: mentorProfile.availabilityStatus || "offline",
            photoUrl: mentorProfile.photoUrl || "",
          });
          setBioInput(mentorProfile.bio || "");
          setExpertiseInput((mentorProfile.expertise || []).join(", "));
          setAvailabilityInput(mentorProfile.availabilityStatus || "offline");
          setPhotoUrlInput(mentorProfile.photoUrl || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const role = base?.role || "student";
  const isMentor = role === "mentor";
  const isStudent = role === "student";

  const displayName = useMemo(() => fullNameInput || userEmail || "User", [fullNameInput, userEmail]);
  const initials = useMemo(
    () => (fullNameInput ? getInitials(fullNameInput) : userEmail?.[0]?.toUpperCase() || "U"),
    [fullNameInput, userEmail]
  );

  const roleBadge = isMentor
    ? "bg-primary/10 text-primary border-primary/20"
    : role === "admin"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-secondary text-muted-foreground border-border";
  const roleLabel = role === "admin" ? "Admin" : isMentor ? "Mentor" : "Student";

  const field =
    "block w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      if (!fullNameInput.trim()) {
        throw new Error("Full name is required.");
      }

      const updatedBase = (await apiPut("/profiles/me", {
        fullName: fullNameInput.trim(),
      })) as BaseProfile;
      setBase(updatedBase);

      if (isStudent) {
        const payload = {
          courseProgram: courseProgramInput.trim(),
          interests: parseCsv(interestsInput),
        };
        const updatedStudent = (await apiPut("/students/me", payload)) as {
          courseProgram: string;
          interests: string[];
        };
        setStudent(updatedStudent);
      }

      if (isMentor) {
        const payload = {
          bio: bioInput.trim(),
          expertise: parseCsv(expertiseInput),
          availabilityStatus: availabilityInput,
          photoUrl: photoUrlInput.trim(),
        };
        const updatedMentor = (await apiPut("/mentors/me", payload)) as MentorProfile;
        setMentor(updatedMentor);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </main>
      </div>
    );
  }

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
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" className={`${field} opacity-60 cursor-not-allowed`} value={userEmail} readOnly />
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            {isStudent && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Course / Program</label>
                  <input
                    type="text"
                    className={field}
                    placeholder="e.g. BSc Computer Science"
                    value={courseProgramInput}
                    onChange={(e) => setCourseProgramInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Interests</label>
                  <input
                    type="text"
                    className={field}
                    placeholder="e.g. Machine Learning, Open Source"
                    value={interestsInput}
                    onChange={(e) => setInterestsInput(e.target.value)}
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
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Expertise</label>
                  <input
                    type="text"
                    className={field}
                    placeholder="e.g. Machine Learning, Python"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Comma-separated list of expertise areas.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Availability Status</label>
                  <select
                    className={`${field} cursor-pointer`}
                    value={availabilityInput}
                    onChange={(e) => setAvailabilityInput(e.target.value as AvailabilityStatus)}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Profile Photo URL</label>
                  <input
                    type="url"
                    className={field}
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {saved && <span className="text-xs text-green-600 font-medium">Changes saved.</span>}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

