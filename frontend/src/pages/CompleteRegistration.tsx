import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function getSuggestedName(user: ReturnType<typeof useAuth>["user"]) {
  const fromMetadata = user?.user_metadata?.full_name || user?.user_metadata?.fullName;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  if (typeof user?.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return "";
}

export default function CompleteRegistration() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(() => getSuggestedName(user));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (profile?.profileExists) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiPost("/auth/complete-registration", {
        fullName: fullName.trim(),
      });
      await refreshProfile();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full border border-border rounded-lg p-8">
        <div className="mb-6">
          <Link to="/" className="text-sm text-primary font-medium hover:underline">
            MentorConnect
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-4">Complete your registration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confirm your details to activate your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
              placeholder="Jane Doe"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleSwitchAccount}
          className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
