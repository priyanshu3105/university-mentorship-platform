import { Link } from "react-router-dom";
import {
  BookOpen, Calendar, MessageSquare, Users, Star, Building2,
  ShieldCheck, Sparkles, ClipboardCheck, BarChart3, UserPlus,
  Search, CalendarCheck, ArrowRight, Quote, Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { MentorConnectLogo } from "@/components/MentorConnectLogo";

/* ── Scroll-reveal hook with stagger support ── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: { animationDelay: `${delay}ms` } as React.CSSProperties,
    className: visible ? "animate-slide-up" : "opacity-0",
  };
}

/* ── Animated counter ── */
function Counter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const num = parseInt(target.replace(/[^0-9]/g, ""));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(num / 40));
        const timer = setInterval(() => {
          start += step;
          if (start >= num) { setCount(num); clearInterval(timer); }
          else setCount(start);
        }, 30);
        obs.unobserve(el);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [num]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Section wrapper ── */
function Section({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`relative ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/* ── Data ── */
const stats = [
  { icon: Users, value: "500", suffix: "+", label: "Verified Mentors" },
  { icon: Calendar, value: "2000", suffix: "+", label: "Sessions Booked" },
  { icon: Star, value: "4.8", suffix: "★", label: "Average Rating" },
  { icon: Building2, value: "15", suffix: "+", label: "Departments" },
];

const steps = [
  { num: 1, icon: UserPlus, title: "Create your account", desc: "Sign up with your university email in seconds.", color: "from-primary/20 to-primary/5" },
  { num: 2, icon: Search, title: "Find your mentor", desc: "Browse by expertise, availability, and reviews.", color: "from-primary/15 to-primary/5" },
  { num: 3, icon: CalendarCheck, title: "Book a session", desc: "Pick a time slot and start your journey.", color: "from-primary/10 to-primary/5" },
];

const features = [
  { icon: ShieldCheck, title: "Verified Mentors", desc: "Every mentor is vetted and approved by your university administration." },
  { icon: CalendarCheck, title: "One-Click Booking", desc: "Schedule sessions instantly from any mentor's profile page." },
  { icon: MessageSquare, title: "Real-Time Chat", desc: "Message mentors directly before and after your sessions." },
  { icon: Sparkles, title: "Smart Matching", desc: "AI-powered recommendations based on your interests and goals." },
  { icon: ClipboardCheck, title: "Session Reviews", desc: "Rate sessions and read reviews to find the best mentors." },
  { icon: BarChart3, title: "Admin Dashboard", desc: "University admins can manage mentors, analytics, and content." },
];

const testimonials = [
  { quote: "MentorConnect matched me with the perfect thesis advisor. We meet weekly and it's been a game-changer for my research.", name: "Sarah O'Connor", program: "MSc Computer Science", rating: 5, avatar: "S" },
  { quote: "I was struggling with my final year project until I found a mentor here. The booking system is incredibly simple.", name: "James Murphy", program: "BEng Mechanical Engineering", rating: 5, avatar: "J" },
  { quote: "As an international student, having a senior mentor who understood my challenges made the transition so much smoother.", name: "Priya Sharma", program: "BA Business Studies", rating: 4, avatar: "P" },
];

const footerCols = [
  { title: "Product", links: ["Features", "How it Works", "Pricing"] },
  { title: "Support", links: ["Help Center", "Contact Us", "FAQs"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service"] },
];

/* ── Component ── */
export default function Landing() {
  const s1 = useReveal();
  const s2 = useReveal();
  const s3 = useReveal();
  const s4 = useReveal();
  const s5 = useReveal();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 border-b border-border glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <MentorConnectLogo size={28} className="group-hover:scale-110 transition-transform" />
            <span className="text-foreground font-semibold text-sm">MentorConnect</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
              Log in
            </Link>
            <Link to="/register" className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 lg:py-44 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Text — staggered fade */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-xs font-medium text-muted-foreground mb-6 animate-slide-up">
                <Zap size={12} className="text-primary" />
                Trusted by 500+ university mentors
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.08] mb-5 animate-slide-up delay-100">
                Find your perfect{" "}
                <span className="text-gradient">mentor</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-slide-up delay-200">
                Connect with experienced academic and industry mentors at your university. Book sessions, get guidance, and accelerate your growth.
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap animate-slide-up delay-300">
                <Link to="/register" className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300">
                  Get Started Free
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link to="/mentors" className="px-6 py-3 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-secondary hover:border-primary/20 transition-all duration-300">
                  Browse Mentors
                </Link>
              </div>
            </div>

            {/* Hero illustration — floating animated elements */}
            <div className="flex-1 hidden lg:flex items-center justify-center">
              <div className="relative w-80 h-80">
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/10 animate-spin-slow" />
                {/* Glowing core */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 animate-pulse-glow" />
                <div className="absolute inset-16 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <BookOpen size={40} className="text-primary animate-float" />
                </div>

                {/* Floating orbit icons */}
                <div className="absolute top-2 right-10 animate-float" style={{ animationDelay: "0.5s" }}>
                  <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-lg shadow-primary/5 flex items-center justify-center">
                    <Users size={18} className="text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-10 left-2 animate-float-slow" style={{ animationDelay: "1s" }}>
                  <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-lg shadow-primary/5 flex items-center justify-center">
                    <MessageSquare size={18} className="text-primary" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-14 animate-float" style={{ animationDelay: "1.5s" }}>
                  <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-lg shadow-primary/5 flex items-center justify-center">
                    <Calendar size={18} className="text-primary" />
                  </div>
                </div>
                <div className="absolute top-14 -left-2 animate-float-slow" style={{ animationDelay: "2s" }}>
                  <div className="w-10 h-10 rounded-lg bg-card border border-border shadow-lg shadow-primary/5 flex items-center justify-center">
                    <Star size={14} className="text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SOCIAL PROOF / STATS ─── */}
        <div ref={s1.ref} className={s1.className} style={s1.style}>
          <div className="border-y border-border bg-secondary/40">
            <Section>
              <div className="py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map(({ icon: Icon, value, suffix, label }, i) => (
                  <div key={label} className="flex flex-col items-center text-center gap-2 animate-count-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                      <Counter target={value} suffix={suffix} />
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <div ref={s2.ref} className={s2.className} style={s2.style}>
          <Section className="py-20 md:py-28">
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">How it works</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">Three simple steps</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Get matched with a mentor and book your first session in minutes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {steps.map(({ num, icon: Icon, title, desc, color }, i) => (
                <div
                  key={num}
                  className="relative group rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {/* Step connector line */}
                  {num < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-5 w-8 lg:w-10 border-t border-dashed border-border" />
                  )}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className="text-primary" />
                  </div>
                  <span className="absolute top-4 right-4 text-4xl font-bold text-muted/80 select-none">0{num}</span>
                  <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ─── FEATURES ─── */}
        <div ref={s3.ref} className={s3.className} style={s3.style}>
          <div className="bg-secondary/30">
            <Section className="py-20 md:py-28">
              <div className="text-center mb-14">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">Features</span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">Everything you need</h2>
                <p className="text-muted-foreground max-w-md mx-auto">Tools designed for university mentorship, all in one place.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {features.map(({ icon: Icon, title, desc }, i) => (
                  <div
                    key={title}
                    className="group bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon size={20} className="text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>

        {/* ─── TESTIMONIALS ─── */}
        <div ref={s4.ref} className={s4.className} style={s4.style}>
          <Section className="py-20 md:py-28">
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">Testimonials</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">Loved by students</h2>
              <p className="text-muted-foreground max-w-md mx-auto">Real experiences from students across all departments.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map(({ quote, name, program, rating, avatar }, i) => (
                <div
                  key={name}
                  className="group border border-border rounded-xl p-6 flex flex-col gap-4 bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <div className="flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} size={14} className={j < rating ? "fill-primary text-primary" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1">"{quote}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{program}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ─── CTA BANNER ─── */}
        <div ref={s5.ref} className={s5.className} style={s5.style}>
          <div className="relative overflow-hidden bg-primary">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary-foreground/[0.05] blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary-foreground/[0.05] blur-2xl" />
            <Section className="py-16 md:py-24 relative">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
                  Ready to find your mentor?
                </h2>
                <p className="text-primary-foreground/75 max-w-md mx-auto mb-8 text-sm sm:text-base">
                  Join thousands of students already growing with MentorConnect. It's completely free.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link to="/register" className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-background text-foreground hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    Get Started Free
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link to="/mentors" className="px-6 py-3 rounded-lg text-sm font-medium border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300">
                    Browse Mentors
                  </Link>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-secondary/20">
        <Section className="py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-3">
                <MentorConnectLogo size={24} />
                <span className="text-foreground font-semibold text-sm">MentorConnect</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">Connecting university students with mentors who can guide their academic and professional journey.</p>
            </div>
            {footerCols.map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">{title}</h4>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200">{l}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
        <div className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <p className="text-xs text-muted-foreground text-center">© {new Date().getFullYear()} MentorConnect. University Mentorship Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
