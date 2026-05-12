import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Wrench, Users, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useMyOrgs, useActiveOrg } from "@/hooks/useActiveOrg";
import { Avatar } from "@/components/ui/Avatar";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { cn } from "@/lib/utils";
const ORG_TYPE_LABELS: Record<string, string> = {
  machine_owner: "Maskinagare",
  service_partner: "Service",
  insurance: "Forsakring",
  finance: "Finans",
  leasing: "Leasing",
  dealer: "Aterforsaljare",
  oem: "Tillverkare",
};

const ORG_TYPE_STYLES: Record<string, string> = {
  machine_owner: "bg-muted/50 text-muted-foreground",
  service_partner: "bg-info/10 text-info",
  insurance: "bg-warning/10 text-warning",
  finance: "bg-primary/10 text-primary",
  leasing: "bg-primary/10 text-primary",
  dealer: "bg-muted/50 text-muted-foreground",
  oem: "bg-muted/50 text-muted-foreground",
};

export function TopBar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: unread } = useUnreadNotifications();
  const { data: myOrgs } = useMyOrgs();
  const { data: activeOrg } = useActiveOrg();
  const hasOrgs = (myOrgs ?? []).length > 0;
  const orgType = activeOrg?.org_type ?? "machine_owner";

  const isMachineOwner = orgType === "machine_owner" || orgType === "dealer" || orgType === "oem";
  const isPartner = orgType === "insurance" || orgType === "finance" || orgType === "leasing";
  const isServicePartner = orgType === "service_partner";

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
          {activeOrg?.org_type && (
            <span
              className={cn(
                "hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium font-mono uppercase tracking-wider",
                ORG_TYPE_STYLES[activeOrg.org_type] ?? "bg-muted/50 text-muted-foreground"
              )}
            >
              {ORG_TYPE_LABELS[activeOrg.org_type] ?? activeOrg.org_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasOrgs && isMachineOwner && (
            <Link
              to="/machines"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-control text-sm text-muted-foreground hover:text-foreground hover:bg-surface-track transition-colors"
            >
              <Wrench className="h-4 w-4" strokeWidth={1.75} />
              <span>Maskiner</span>
            </Link>
          )}
          {hasOrgs && isMachineOwner && (
            <Link
              to="/team"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-control text-sm text-muted-foreground hover:text-foreground hover:bg-surface-track transition-colors"
            >
              <Users className="h-4 w-4" strokeWidth={1.75} />
              <span>Team</span>
            </Link>
          )}
          {hasOrgs && isPartner && (
            <Link
              to="/partner/customers"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-control text-sm text-muted-foreground hover:text-foreground hover:bg-surface-track transition-colors"
            >
              <Building2 className="h-4 w-4" strokeWidth={1.75} />
              <span>Kunder</span>
            </Link>
          )}
          {hasOrgs && isServicePartner && (
            <Link
              to="/machines"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-control text-sm text-muted-foreground hover:text-foreground hover:bg-surface-track transition-colors"
            >
              <Wrench className="h-4 w-4" strokeWidth={1.75} />
              <span>Maskiner</span>
            </Link>
          )}
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
