import { Link } from "react-router-dom";
import { BookOpen, Calendar, MessageSquare } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Discover Mentors",
    description: "Browse verified university mentors by expertise, availability, and student reviews.",
  },
  {
    icon: Calendar,
    title: "Book Sessions",
    description: "Schedule one-on-one sessions directly from mentor profiles at times that suit you.",
  },
  {
    icon: MessageSquare,
    title: "Chat in Real-Time",
    description: "Message your mentors before and after sessions to keep the conversation going.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal landing nav */}
      <header className="border-b border-border">
        <div className="page-container h-14 flex items-center justify-between">
          <span className="text-foreground font-semibold text-sm">MentorConnect</span>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="page-container py-16 sm:py-20 md:py-28 lg:py-36 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-4">
            Find your university mentor
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8 sm:mb-10">
            Connect with experienced academic and industry mentors at your university. Book sessions, get guidance, and grow.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              to="/mentors"
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Browse Mentors
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="page-container pb-16 sm:pb-20 md:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="border border-border rounded-lg p-6">
                <div className="w-8 h-8 flex items-center justify-center rounded-md bg-secondary mb-4">
                  <Icon size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="page-container">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} MentorConnect. University Mentorship Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
