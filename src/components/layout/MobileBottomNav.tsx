import { NavLink, useNavigate } from "react-router-dom";
import { Home, Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: unread } = useUnreadNotifications();

  const onSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

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
        <button type="button" onClick={onSignOut} className={cn(itemBase, inactive)}>
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
          <span>Logga ut</span>
        </button>
      </div>
    </nav>
  );
}
