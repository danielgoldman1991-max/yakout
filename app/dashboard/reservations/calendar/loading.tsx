export default function CalendarLoading() {
  return <div className="animate-pulse space-y-5" aria-label="Chargement du planning"><div className="h-10 w-80 rounded bg-muted"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-7">{Array.from({length:7}).map((_,i)=><div key={i} className="h-20 rounded bg-muted"/>)}</div><div className="h-14 rounded bg-muted"/><div className="overflow-hidden rounded border border-border"><div className="h-12 bg-muted"/>{Array.from({length:5}).map((_,i)=><div key={i} className="mt-px h-24 bg-muted/70"/>)}</div></div>;
}
