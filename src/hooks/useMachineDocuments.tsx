import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useActiveOrg } from "@/hooks/useActiveOrg";

export interface DocumentRow {
  id: string;
  machine_id: string | null;
  org_id: string | null;
  document_type: string;
  title: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  version: number;
  parent_document_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  uploaded_by: string | null;
  created_at: string;
  deleted_at: string | null;
}

export const DOCUMENT_TYPES = [
  { value: "purchase_agreement", label: "Köpeavtal" },
  { value: "service_protocol", label: "Serviceprotokoll" },
  { value: "insurance", label: "Försäkringsbrev" },
  { value: "photo", label: "Foto" },
  { value: "type_plate", label: "Typskyltsfoto" },
  { value: "finance_agreement", label: "Finansavtal" },
  { value: "other", label: "Övrigt" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

export function useMachineDocuments(machineId: string | undefined) {
  return useQuery({
    queryKey: ["machine-documents", machineId],
    enabled: !!machineId,
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("machine_id", machineId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentRow[];
    },
  });
}

interface UploadDocumentInput {
  machineId: string;
  file: File;
  documentType: DocumentType;
  title: string;
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: activeOrg } = useActiveOrg();

  return useMutation({
    mutationFn: async ({ machineId, file, documentType, title }: UploadDocumentInput) => {
      if (!user?.id) throw new Error("Inte inloggad");
      if (!activeOrg?.id) throw new Error("Ingen organisation vald");
      if (file.size > 10 * 1024 * 1024) throw new Error("Max 10 MB");

      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const storagePath = `${user.id}/${machineId}/${crypto.randomUUID()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("machine-documents")
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      // Insert document record
      const { data, error } = await supabase
        .from("documents")
        .insert({
          machine_id: machineId,
          org_id: activeOrg.id,
          document_type: documentType,
          title,
          file_path: storagePath,
          file_size_bytes: file.size,
          mime_type: file.type || null,
          uploaded_by: user.id,
          tags: [],
          metadata: {},
        })
        .select("id")
        .single();
      if (error) throw error;

      // Log event
      await supabase.from("machine_events").insert({
        machine_id: machineId,
        actor_user_id: user.id,
        event_type: "document_added",
        title: "Dokument uppladdat",
        description: `"${title}" (${documentType}) lades till.`,
        metadata: { document_type: documentType, title },
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["machine-documents", variables.machineId] });
      queryClient.invalidateQueries({ queryKey: ["machine-events", variables.machineId] });
      toast.success("Dokument uppladdat");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Kunde inte ladda upp dokument");
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ documentId, machineId }: { documentId: string; machineId: string }) => {
      // Soft delete
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", documentId);
      if (error) throw error;

      // Log event
      if (user?.id) {
        await supabase.from("machine_events").insert({
          machine_id: machineId,
          actor_user_id: user.id,
          event_type: "document_deleted",
          title: "Dokument borttaget",
          description: "Ett dokument togs bort från maskinen.",
          metadata: { document_id: documentId },
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["machine-documents", variables.machineId] });
      queryClient.invalidateQueries({ queryKey: ["machine-events", variables.machineId] });
      toast.success("Dokument borttaget");
    },
    onError: () => {
      toast.error("Kunde inte ta bort dokument");
    },
  });
}

export async function getSignedDocumentUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("machine-documents")
    .createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
