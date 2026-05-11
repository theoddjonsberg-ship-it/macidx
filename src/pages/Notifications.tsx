import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  UserPlus,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import type { NotificationRow, NotificationType } from "@/types/database";

function describeType(type: NotificationType): LucideIcon {
  switch (type) {
    case "team_invite_accepted":
      return UserPlus;
    case "password_changed":
      return ShieldCheck;
    case "welcome":
      return Sparkles;
    default:
      return Bell;
  }
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "nyss";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} tim`;
  const days = Math.round(hours / 24);
  return `${days} d`;
}

export function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications-list", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
  });

  const items = listQuery.data ?? [];
  const unreadCount = items.filter((n) => n.read_at === null).length;

  const handleClick = (n: NotificationRow) => {
    if (n.read_at === null) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <AppShell>
      <DashboardHeader
        title="Notifikationer"
        subtitle="Senaste händelser som rör dig. Klicka för att öppna eller markera som läst."
        actions={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Markera alla som lästa
            </Button>
          )
        }
      />

      <Card>
        {listQuery.isLoading ? (
          <ul className="divide-y divide-border" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="py-3 flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-coin" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </li>
            ))}
          </ul>
        ) : listQuery.isError ? (
          <div>
            <FormError>Kunde inte hämta notifikationer</FormError>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => listQuery.refetch()}
              className="mt-2"
            >
              Försök igen
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyStateCard
            icon={Bell}
            title="Inga notifikationer"
            description="När något händer i din organisation som berör dig visas det här."
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const Icon = describeType(n.type);
              const isUnread = n.read_at === null;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className="w-full py-3 flex items-start gap-3 text-left rounded-control hover:bg-muted/40 px-2 -mx-2 transition-colors"
                  >
                    <div className="relative h-8 w-8 rounded-coin bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon
                        className="h-4 w-4 text-muted-foreground"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      {isUnread && (
                        <span
                          className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary"
                          aria-label="Oläst"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={
                          isUnread
                            ? "text-sm font-semibold text-foreground truncate"
                            : "text-sm text-foreground truncate"
                        }
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0 tabular-nums mt-1">
                      {timeAgo(n.created_at)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
