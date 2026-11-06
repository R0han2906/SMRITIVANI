import { motion } from "framer-motion";
import { Bell, Brain, CalendarDays, Heart, Home, Mic, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Home", icon: Home, path: "/caregiver" },
  { label: "Memory", icon: Brain, path: "/caregiver/memory" },
  { label: "Events", icon: CalendarDays, path: "/caregiver/events" },
  { label: "Notes", icon: Mic, path: "/caregiver/notes" },
  { label: "Profile", icon: User, path: "/caregiver/settings" },
];

export function CaregiverTopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white">
            <Heart className="size-5 fill-current" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold">SmritiVani</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/caregiver/emergency"
            className="relative flex size-10 items-center justify-center rounded-xl hover:bg-cream"
            aria-label="Notifications"
          >
            <Bell className="size-6 text-muted" aria-hidden="true" />
            <span className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              2
            </span>
          </Link>
          <Link
            to="/caregiver/settings"
            className="flex size-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
            aria-label="Open profile"
          >
            RS
          </Link>
        </div>
      </div>
    </header>
  );
}

export function CaregiverBottomNav({ activeOverride }: { activeOverride?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[76px] max-w-2xl rounded-t-2xl border-x border-t border-line bg-white/95 px-2 shadow-[0_-8px_24px_rgba(64,55,40,0.08)] backdrop-blur-sm">
      <div className="flex h-full items-center justify-around">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = activeOverride ? label === activeOverride : location.pathname === path;
          return (
            <motion.button
              key={label}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(path)}
              className={`relative flex min-w-14 flex-col items-center gap-1 px-2 py-2 ${active ? "text-brand" : "text-muted"}`}
            >
              {active && <span className="absolute -top-1 h-1 w-7 rounded-full bg-brand" />}
              <Icon className={`size-6 ${active ? "scale-110" : ""}`} aria-hidden="true" />
              <span className="text-xs font-bold">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
