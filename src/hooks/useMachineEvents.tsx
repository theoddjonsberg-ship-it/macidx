import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface MachineEvent {
  id: string;
  machine_id: string;
  actor_user_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined from profiles
  actor_display_name?: string | null;
}

interface UseMachineEventsOptions {
  pageSize?: number;
  eventTypeFilter?: string | null;
}

export function useMachineEvents(
  machineId: string | undefined,
  options: UseMachineEventsOptions = {}
) {
  const { pageSize = 25, eventTypeFilter = null } = options;
  const queryClient = useQueryClient();

  // Subscribe to realtime events
  useEffect(() => {
    if (!machineId) return;

    const channel = supabase
      .channel(`machine-events:${machineId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "machine_events",
          filter: `machine_id=eq.${machineId}`,
        },
        () => {
          // Invalidate query to refetch
          queryClient.invalidateQueries({ queryKey: ["machine-events", machineId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [machineId, queryClient]);

  return useQuery({
    queryKey: ["machine-events", machineId, eventTypeFilter, pageSize],
    enabled: !!machineId,
    queryFn: async (): Promise<MachineEvent[]> => {
      let query = supabase
        .from("machine_events")
        .select("*")
        .eq("machine_id", machineId!)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (eventTypeFilter) {
        query = query.eq("event_type", eventTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch actor display names separately
      const events = data ?? [];
      const actorIds = [...new Set(events.map((e) => e.actor_user_id).filter(Boolean))] as string[];

      let actorMap = new Map<string, string | null>();
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", actorIds);
        if (profiles) {
          profiles.forEach((p) => actorMap.set(p.user_id, p.display_name));
        }
      }

      return events.map((row) => ({
        id: row.id,
        machine_id: row.machine_id,
        actor_user_id: row.actor_user_id,
        event_type: row.event_type,
        title: row.title,
        description: row.description,
        metadata: row.metadata as Record<string, unknown> | null,
        created_at: row.created_at,
        actor_display_name: row.actor_user_id ? actorMap.get(row.actor_user_id) ?? null : null,
      }));
    },
  });
}

// Event type labels and icons (Swedish)
export const EVENT_TYPE_LABELS: Record<string, string> = {
  registration: "Registrering",
  status_change: "Statusändring",
  verification: "Verifiering",
  service: "Service",
  ownership_transferred: "Ägarbyte",
  document_added: "Dokument",
  document_deleted: "Dokument borttaget",
  consent_granted: "Samtycke",
  consent_revoked: "Samtycke återkallat",
  gps_connect: "GPS kopplad",
  engine_hours_sync: "Drifttimmar",
};

export const EVENT_TYPE_FILTERS = [
  { value: null, label: "Alla" },
  { value: "registration", label: "Registrering" },
  { value: "verification", label: "Verifiering" },
  { value: "service", label: "Service" },
  { value: "ownership_transferred", label: "Ägarbyte" },
  { value: "document_added", label: "Dokument" },
  { value: "consent_granted", label: "Samtycke" },
] as const;

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "Just nu";
  if (minutes < 60) return `${minutes} min sedan`;
  if (hours < 24) return `${hours} tim sedan`;
  if (days < 7) return `${days} dagar sedan`;
  if (weeks < 4) return `${weeks} veckor sedan`;
  if (months < 12) return `${months} mån sedan`;
  return new Date(isoDate).toLocaleDateString("sv-SE");
}
