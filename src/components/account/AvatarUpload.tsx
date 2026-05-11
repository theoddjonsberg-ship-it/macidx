import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useInvalidateProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUpload() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const invalidate = useInvalidateProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError(null);
    setSaved(false);

    if (!ACCEPTED.includes(file.type)) {
      setError("Endast PNG, JPEG eller WebP");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Max 2 MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (updErr) {
      setError(updErr.message);
      return;
    }

    await invalidate();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar
        src={profile?.avatar_url}
        name={profile?.display_name}
        className="h-14 w-14 text-base"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onPick}
            disabled={uploading}
            className="inline-flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={1.75} />
            )}
            {uploading
              ? "Laddar upp…"
              : profile?.avatar_url
              ? "Byt bild"
              : "Ladda upp bild"}
          </Button>
          {saved && (
            <span className="text-xs text-muted-foreground" role="status">
              Uppdaterad
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          PNG, JPEG eller WebP. Max 2 MB.
        </p>
        <FormError>{error}</FormError>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onChange}
        className="sr-only"
      />
    </div>
  );
}
