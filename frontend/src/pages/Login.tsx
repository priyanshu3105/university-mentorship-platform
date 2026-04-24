import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const field =
    "block w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    const emailVerified = Boolean(data.user?.email_confirmed_at);
    if (!emailVerified) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Please verify your email before logging in.");
      return;
    }

    if (!data.session) {
      setLoading(false);
      setError("Unable to create a login session. Please try again.");
      return;
    }

    setLoading(false);
    navigate(from, { replace: true });
  };

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setInfo("");
      setError("Enter your email first, then click Forgot password.");
      return;
    }

    setForgotLoading(true);
    setError("");
    setInfo("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setForgotLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    setInfo("Password reset link sent. Check your email inbox.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full border border-border rounded-lg p-8">
        <div className="mb-6">
          <Link to="/" className="text-sm text-primary font-medium hover:underline">
            MentorConnect
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-4">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input
              type="email"
              className={field}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={forgotLoading || loading}
                className="text-xs text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {forgotLoading ? "Sending..." : "Forgot password?"}
              </button>
            </div>
            <input
              type="password"
              className={field}
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/5 border border-destructive/20 px-3 py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {info && (
            <div className="rounded-md bg-green-500/5 border border-green-500/20 px-3 py-2">
              <p className="text-xs text-green-700 dark:text-green-300">{info}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
