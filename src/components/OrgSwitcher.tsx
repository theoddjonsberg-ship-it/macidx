import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, Plus, Building2 } from "lucide-react";
import { useActiveOrg, useMyOrgs, useSetActiveOrg } from "@/hooks/useActiveOrg";
import { CreateOrgDialog } from "@/components/CreateOrgDialog";
import type { AppRole } from "@/types/database";

function roleLabel(role: AppRole): string {
  switch (role) {
    case "owner":
      return "Ägare";
    case "admin":
      return "Administratör";
    case "member":
      return "Medlem";
    case "viewer":
      return "Läsare";
    case "platform_admin":
      return "Plattformsadmin";
    default:
      return role;
  }
}

export function OrgSwitcher() {
  const navigate = useNavigate();
  const { data: activeOrg } = useActiveOrg();
  const { data: myOrgs } = useMyOrgs();
  const setActiveOrg = useSetActiveOrg();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const orgs = myOrgs ?? [];

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

  const handleOrgSelect = (orgId: string) => {
    if (orgId === activeOrg?.id) {
      setMenuOpen(false);
      return;
    }
    setActiveOrg(orgId);
    setMenuOpen(false);
    navigate("/");
  };

  const handleCreateClick = () => {
    setMenuOpen(false);
    setDialogOpen(true);
  };

  if (!activeOrg) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="h-11 min-h-touch px-3 inline-flex items-center gap-2 rounded-control hover:bg-surface-track text-sm font-medium text-foreground max-w-[180px] sm:max-w-[240px]"
        >
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <span className="truncate">{activeOrg.name}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              menuOpen ? "rotate-180" : ""
            }`}
            strokeWidth={1.75}
          />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute left-0 mt-1 w-64 bg-popover text-popover-foreground border border-border rounded-control py-1 z-10"
          >
            {orgs.map((org) => {
              const isActive = org.org_id === activeOrg.id;
              return (
                <button
                  key={org.org_id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleOrgSelect(org.org_id)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-track min-h-touch flex items-center gap-3"
                >
                  <span
                    className={`h-5 w-5 shrink-0 flex items-center justify-center ${
                      isActive ? "text-primary" : "text-transparent"
                    }`}
                  >
                    {isActive && <Check className="h-4 w-4" strokeWidth={1.75} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{org.org_name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel(org.role)}</p>
                  </div>
                </button>
              );
            })}

            <div className="border-t border-border my-1" role="separator" />

            <button
              type="button"
              role="menuitem"
              onClick={handleCreateClick}
              className="w-full text-left px-3 py-2 hover:bg-surface-track min-h-touch flex items-center gap-3"
            >
              <span className="h-5 w-5 shrink-0 flex items-center justify-center text-muted-foreground">
                <Plus className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="text-sm">Skapa ny organisation</span>
            </button>
          </div>
        )}
      </div>

      <CreateOrgDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
