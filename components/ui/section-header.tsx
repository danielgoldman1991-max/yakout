export function SectionHeader({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      {label && (
        <div className="flex items-center gap-3">
          <span className="ruby-diamond" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
            {label}
          </p>
          <span className="gold-sep" />
        </div>
      )}
      <h2 className="mt-5 font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
