import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useMyOrgs } from "@/hooks/useActiveOrg";
import { Avatar } from "@/components/ui/Avatar";
import { OrgSwitcher } from "@/components/OrgSwitcher";

export function TopBar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: unread } = useUnreadNotifications();
  const { data: myOrgs } = useMyOrgs();
  const hasOrgs = (myOrgs ?? []).length > 0;

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

  const unreadCount = unread ?? 0;
  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-mono text-sm font-semibold tracking-widest uppercase shrink-0">
            MachIndex
          </Link>
          {hasOrgs && <OrgSwitcher />}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifikationer (${unreadCount} olästa)`
                : "Notifikationer"
            }
            className="relative inline-flex items-center justify-center h-11 w-11 min-h-touch min-w-touch rounded-control hover:bg-surface-track"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums"
                aria-hidden="true"
              >
                {badgeText}
              </span>
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
                className="absolute right-0 mt-1 w-44 bg-popover text-popover-foreground border border-border rounded-control py-1 z-10"
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
