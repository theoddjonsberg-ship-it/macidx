import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSetActiveOrg } from "@/hooks/useActiveOrg";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Minst 2 tecken").max(200, "Max 200 tecken"),
  org_number: z.string().trim().max(40, "Max 40 tecken").optional().or(z.literal("")),
  country: z
    .string()
    .trim()
    .max(2, "Använd tvåbokstavskod, t.ex. SE")
    .optional()
    .or(z.literal("")),
});
type CreateOrgInput = z.infer<typeof createOrgSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateOrgDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setActiveOrg = useSetActiveOrg();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: "", org_number: "", country: "SE" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      reset();
      setSubmitError(null);
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose, reset]);

  const onSubmit = async (values: CreateOrgInput) => {
    setSubmitError(null);

    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: values.name,
        org_number: values.org_number || null,
        country: values.country || null,
      })
      .select("id")
      .single();

    if (error) {
      setSubmitError(error.message);
      return;
    }

    // Set new org as active
    setActiveOrg(data.id);

    // Invalidate my-orgs query
    queryClient.invalidateQueries({ queryKey: ["my-orgs"] });

    // Close dialog and navigate
    dialogRef.current?.close();
    navigate("/");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 w-full max-w-md p-0 m-auto bg-transparent backdrop:bg-black/50"
    >
      <div className="bg-popover text-popover-foreground border border-border rounded-control p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Skapa organisation</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-9 w-9 min-h-touch min-w-touch inline-flex items-center justify-center rounded-control hover:bg-surface-track"
            aria-label="Stäng"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="create-org-name">Namn</Label>
            <Input
              id="create-org-name"
              autoFocus
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <FormError>{errors.name?.message}</FormError>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-org-number">Org-nummer (valfritt)</Label>
            <Input
              id="create-org-number"
              {...register("org_number")}
              aria-invalid={!!errors.org_number}
            />
            <FormError>{errors.org_number?.message}</FormError>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-org-country">Land (ISO-kod)</Label>
            <Input
              id="create-org-country"
              maxLength={2}
              placeholder="SE"
              {...register("country")}
              aria-invalid={!!errors.country}
            />
            <FormError>{errors.country?.message}</FormError>
          </div>

          <FormError>{submitError}</FormError>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Skapar..." : "Skapa"}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
