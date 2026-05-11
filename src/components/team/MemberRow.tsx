import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { AppRole } from "@/types/database";
import type { TeamMember } from "@/hooks/useTeam";

interface Props {
  member: TeamMember;
  orgId: string;
  myRole: AppRole | null;
  onChanged: () => void;
}

const ASSIGNABLE_BY: Record<AppRole, AppRole[]> = {
  platform_admin: ["owner", "admin", "member", "viewer"],
  owner: ["owner", "admin", "member", "viewer"],
  admin: ["member", "viewer"],
  member: [],
  viewer: [],
};

const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  platform_admin: "Platform admin",
};

export function MemberRow({ member, orgId, myRole, onChanged }: Props) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isSelf = member.user_id === user?.id;
  const assignable = myRole ? ASSIGNABLE_BY[myRole] : [];
  const canChangeRole =
    !isSelf && member.role !== null && assignable.includes(member.role) && assignable.length > 0;
  const canRemove =
    !isSelf && member.role !== null && assignable.includes(member.role);

  const changeRole = async (next: AppRole) => {
    if (!member.role || next === member.role) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("user_roles")
      .update({ role: next })
      .eq("user_id", member.user_id)
      .eq("org_id", orgId)
      .eq("role", member.role);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    onChanged();
  };

  const remove = async () => {
    setBusy(true);
    setError(null);

    const { error: rErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", member.user_id)
      .eq("org_id", orgId);
    if (rErr) {
      setBusy(false);
      setError(rErr.message);
      return;
    }

    const { error: mErr } = await supabase
      .from("organization_members")
      .delete()
      .eq("user_id", member.user_id)
      .eq("org_id", orgId);
    setBusy(false);
    if (mErr) {
      setError(mErr.message);
      return;
    }
    onChanged();
  };

  return (
    <li className="py-3 flex items-center gap-3">
      <Avatar src={member.avatar_url} name={member.display_name} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          {member.display_name || "Namnlös"}
          {isSelf && <span className="text-muted-foreground ml-2">(du)</span>}
        </p>
        {error && (
          <div className="mt-1">
            <FormError>{error}</FormError>
          </div>
        )}
      </div>

      {canChangeRole ? (
        <select
          aria-label="Roll"
          disabled={busy}
          value={member.role ?? ""}
          onChange={(e) => changeRole(e.target.value as AppRole)}
          className="h-9 min-h-touch rounded-control bg-surface-raised text-foreground border border-border px-2 text-sm focus:border-primary/40"
        >
          {member.role && !assignable.includes(member.role) && (
            <option value={member.role}>{ROLE_LABEL[member.role]}</option>
          )}
          {assignable.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-xs text-muted-foreground font-mono px-2">
          {member.role ? ROLE_LABEL[member.role] : "—"}
        </span>
      )}

      {canRemove && (
        confirmRemove ? (
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmRemove(false)} disabled={busy}>
              Avbryt
            </Button>
            <Button type="button" size="sm" onClick={remove} disabled={busy}>
              {busy ? "…" : "Ta bort"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Ta bort ${member.display_name || "medlem"}`}
            onClick={() => setConfirmRemove(true)}
            disabled={busy}
            className="inline-flex items-center justify-center h-11 w-11 min-h-touch min-w-touch rounded-control hover:bg-surface-track text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )
      )}
    </li>
  );
}
