import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export function TopBar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: unread } = useUnreadNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const onSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/" className="font-condensed text-sm font-semibold tracking-widest uppercase">
          MachIndex
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label={
              unread && unread > 0
                ? `Notifikationer (${unread} olästa)`
                : "Notifikationer"
            }
            className="relative inline-flex items-center justify-center h-11 w-11 min-h-touch min-w-touch rounded-button hover:bg-surface-track"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            {!!unread && unread > 0 && (
              <span
                className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className="inline-flex items-center justify-center h-11 w-11 min-h-touch min-w-touch rounded-full hover:bg-surface-track"
            >
              <Avatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className={cn(
                  "absolute right-0 mt-1 w-44 bg-surface-raised border border-border rounded-input shadow-soft-raised dark:shadow-none",
                  "py-1 z-10"
                )}
              >
                <Link
                  to="/account"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 text-sm hover:bg-surface-track min-h-touch flex items-center"
                >
                  Konto
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onSignOut}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-track min-h-touch"
                >
                  Logga ut
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
