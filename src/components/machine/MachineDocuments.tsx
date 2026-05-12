import { useState, useRef, useCallback } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  MoreVertical,
  FileImage,
  File,
  X,
} from "lucide-react";
import {
  useMachineDocuments,
  useUploadDocument,
  useDeleteDocument,
  getSignedDocumentUrl,
  formatFileSize,
  DOCUMENT_TYPES,
  type DocumentType,
  type DocumentRow,
} from "@/hooks/useMachineDocuments";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface MachineDocumentsProps {
  machineId: string;
  canManage: boolean;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  photo: FileImage,
  type_plate: FileImage,
};

function getTypeIcon(type: string) {
  return TYPE_ICONS[type] || FileText;
}

function getTypeLabel(value: string): string {
  return DOCUMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function MachineDocuments({ machineId, canManage }: MachineDocumentsProps) {
  const { data: documents, isLoading } = useMachineDocuments(machineId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocumentType>("other");
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<DocumentRow | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (canManage) setIsDragging(true);
  }, [canManage]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!canManage) return;
      const file = e.dataTransfer.files?.[0];
      if (file) {
        setSelectedFile(file);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setShowUpload(true);
      }
    },
    [canManage, title]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title) return;
    await uploadDocument.mutateAsync({
      machineId,
      file: selectedFile,
      documentType: docType,
      title,
    });
    resetUploadState();
  };

  const resetUploadState = () => {
    setShowUpload(false);
    setSelectedFile(null);
    setTitle("");
    setDocType("other");
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteDocument.mutateAsync({
      documentId: confirmDelete.id,
      machineId,
    });
    setConfirmDelete(null);
  };

  const handleView = async (doc: DocumentRow) => {
    const url = await getSignedDocumentUrl(doc.file_path);
    if (url) window.open(url, "_blank");
  };

  // Group documents by type
  const grouped = (documents ?? []).reduce(
    (acc, doc) => {
      const type = doc.document_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(doc);
      return acc;
    },
    {} as Record<string, DocumentRow[]>
  );

  if (isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      {canManage && (
        <Card
          className={cn(
            "transition-all",
            isDragging && "ring-2 ring-primary/50 bg-primary/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {showUpload ? (
            <div className="space-y-4">
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="application/pdf,image/*"
                onChange={handleFileSelect}
              />

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-full h-24 rounded-control border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-sm text-muted-foreground">
                    Dra och släpp eller klicka för att välja
                  </span>
                  <span className="text-xs text-muted-foreground/60">
                    PDF, bilder · Max 10 MB
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-control bg-muted/20">
                  <File className="h-5 w-5 text-primary flex-shrink-0" strokeWidth={1.75} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setTitle("");
                    }}
                  >
                    <X className="h-4 w-4" strokeWidth={1.75} />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="doc-title">Titel</Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="T.ex. Köpeavtal 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-type">Dokumenttyp</Label>
                <select
                  id="doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="flex h-10 w-full rounded-control border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !title || uploadDocument.isPending}
                >
                  {uploadDocument.isPending ? "Laddar upp..." : "Ladda upp"}
                </Button>
                <Button variant="secondary" onClick={resetUploadState}>
                  Avbryt
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="w-full h-20 rounded-control border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-1"
            >
              <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm text-muted-foreground">Ladda upp dokument</span>
            </button>
          )}
        </Card>
      )}

      {/* Document list */}
      {Object.keys(grouped).length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-foreground mb-1">Inga dokument</p>
          <p className="text-xs text-muted-foreground">
            {canManage
              ? "Dra och släpp filer här, eller klicka för att ladda upp."
              : "Inga dokument har laddats upp för denna maskin."}
          </p>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, docs]) => {
          const Icon = getTypeIcon(type);
          return (
            <Card key={type}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {getTypeLabel(type)}
                </span>
                <span className="text-xs text-muted-foreground/60 font-mono">
                  ({docs.length})
                </span>
              </div>
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2 rounded-control hover:bg-muted/20 transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size_bytes)} ·{" "}
                        {new Date(doc.created_at).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                    <div className="relative">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
                      </Button>
                      {openMenu === doc.id && (
                        <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-control py-1 min-w-[120px]">
                          <button
                            type="button"
                            onClick={() => {
                              handleView(doc);
                              setOpenMenu(null);
                            }}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 flex items-center gap-2"
                          >
                            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Visa
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDelete(doc);
                                setOpenMenu(null);
                              }}
                              className="w-full px-3 py-2 text-sm text-left hover:bg-muted/50 flex items-center gap-2 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              Radera
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Ta bort dokument
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Är du säker på att du vill ta bort "{confirmDelete.title}"?
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Avbryt
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteDocument.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteDocument.isPending ? "Tar bort..." : "Ta bort"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
