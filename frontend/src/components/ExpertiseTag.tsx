interface ExpertiseTagProps {
  label: string;
}

export default function ExpertiseTag({ label }: ExpertiseTagProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-xs font-medium border border-border">
      {label}
    </span>
  );
}
