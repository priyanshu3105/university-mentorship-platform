import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, MessageSquare, ShieldCheck, ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChatSocket } from "@/contexts/ChatSocketContext";
import ThemeToggle from "@/components/ThemeToggle";
import { MentorConnectLogo } from "@/components/MentorConnectLogo";

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mentors", label: "Mentors", icon: Users },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { chatUnreadCount } = useChatSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userEmail = user?.email ?? null;
  const displayName = profile?.fullName || profile?.email || userEmail || "User";
  const initials = profile?.fullName
    ? getInitials(profile.fullName)
    : (profile?.email?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? "U");
  const role = profile?.role;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2">
            <MentorConnectLogo size={28} />
            <span className="text-foreground font-semibold text-sm tracking-tight">MentorConnect</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors inline-flex items-center gap-1.5 ${
                  isActive(to)
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {label}
                {to === "/chat" && chatUnreadCount > 0 ? (
                  <span className="min-w-[1.125rem] h-4 px-1 rounded-full bg-primary text-[10px] leading-none text-primary-foreground flex items-center justify-center font-medium">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                ) : null}
              </Link>
            ))}
            {role === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive("/admin")
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                  {initials}
                </div>
                <span className="hidden sm:block">{displayName}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-border rounded-lg shadow-sm z-50 py-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <User size={14} className="text-muted-foreground" />
                      Profile
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors w-full text-left"
                    >
                      <LogOut size={14} className="text-muted-foreground" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                isActive(to)
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon size={13} />
              {label}
              {to === "/chat" && chatUnreadCount > 0 ? (
                <span className="min-w-[1.125rem] h-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-medium">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              ) : null}
            </Link>
          ))}
          {role === "admin" && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                isActive("/admin")
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <ShieldCheck size={13} />
              Admin
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
