interface Props {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </header>
  );
}
