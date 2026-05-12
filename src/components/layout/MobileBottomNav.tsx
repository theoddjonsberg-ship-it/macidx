import { NavLink } from "react-router-dom";
import { Home, Bell, User, Wrench, Building2 } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { data: unread } = useUnreadNotifications();
  const { data: activeOrg } = useActiveOrg();

  const orgType = activeOrg?.org_type ?? "machine_owner";
  const isMachineOwner = orgType === "machine_owner" || orgType === "dealer" || orgType === "oem";
  const isPartner = orgType === "insurance" || orgType === "finance" || orgType === "leasing";
  const isServicePartner = orgType === "service_partner";

  const itemBase =
    "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-touch text-[11px]";
  const active = "text-foreground";
  const inactive = "text-muted-foreground";

  return (
    <nav
      aria-label="Huvudnavigation"
      className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-background"
    >
      <div className="flex items-stretch h-14">
        <NavLink to="/" end className={({ isActive }) => cn(itemBase, isActive ? active : inactive)}>
          <Home className="h-5 w-5" strokeWidth={1.75} />
          <span>Hem</span>
        </NavLink>

        {(isMachineOwner || isServicePartner) && (
          <NavLink to="/machines" className={({ isActive }) => cn(itemBase, isActive ? active : inactive)}>
            <Wrench className="h-5 w-5" strokeWidth={1.75} />
            <span>Maskiner</span>
          </NavLink>
        )}

        {isPartner && (
          <NavLink to="/partner/customers" className={({ isActive }) => cn(itemBase, isActive ? active : inactive)}>
            <Building2 className="h-5 w-5" strokeWidth={1.75} />
            <span>Kunder</span>
          </NavLink>
        )}

        <NavLink
          to="/notifications"
          className={({ isActive }) => cn(itemBase, isActive ? active : inactive)}
        >
          <div className="relative">
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            {!!unread && unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </div>
          <span>Notiser</span>
        </NavLink>

        <NavLink to="/account" className={({ isActive }) => cn(itemBase, isActive ? active : inactive)}>
          <User className="h-5 w-5" strokeWidth={1.75} />
          <span>Konto</span>
        </NavLink>
      </div>
    </nav>
  );
}
