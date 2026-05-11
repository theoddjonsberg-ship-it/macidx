interface PlaceholderProps {
  title: string;
}

export function Placeholder({ title }: PlaceholderProps) {
  return (
    <div className="text-center py-12">
      <p className="font-condensed text-xs tracking-widest uppercase text-muted-foreground mb-2">
        MachIndex
      </p>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Den här vyn implementeras i ett senare steg.
      </p>
    </div>
  );
}
