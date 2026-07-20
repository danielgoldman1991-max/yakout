"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { DateField } from "@/components/ui/date-field";

type Apartment = { id: string; slug: string; title: string; district: string; capacity: number; bedrooms: number; beds?: number; pricePerNight: number | null; imageUrl?: string };
type Service = { id: string; title: string; description?: string };
type PackageContext = { id: string; slug: string; title: string; durationLabel?: string; items: Array<{ id: string; title: string; description?: string; isOptional?: boolean }> };
type TransferMode = "none" | "arrival" | "departure" | "round_trip";
type AccommodationMode = "selected_apartment" | "yakout_suggestion" | "external_accommodation";
type Flight = { airport: "RAK"; airline: string; flightNumber: string; date: string; time: string; passengers: number; specialLuggage: string };

type FormState = {
  checkIn: string; checkOut: string; adults: number; children: number; infants: number;
  accommodationMode: AccommodationMode; apartmentId: string | null; externalName: string; externalLocation: string;
  atmosphere: string[]; transferMode: TransferMode; arrival: Flight; departure: Flight;
  driverSelected: boolean; driverType: "few_trips" | "half_day" | "full_day" | "multi_day" | "to_define"; driverFrom: string; driverTo: string; driverNotes: string;
  serviceIds: string[]; serviceDetails: Record<string, string>;
  name: string; phone: string; email: string; preferredChannel: "whatsapp" | "phone" | "email"; message: string; consent: boolean;
};

const steps = ["Votre séjour", "Hébergement", "Transports", "Services", "Coordonnées"];
const inputClass = "min-h-11 w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/20";
const labelClass = "block text-xs font-semibold text-foreground";
const radioClass = "flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border border-border bg-card p-4 transition hover:border-gold/50 has-[:checked]:border-gold has-[:checked]:bg-gold/5";

function emptyFlight(passengers = 1): Flight { return { airport: "RAK", airline: "", flightNumber: "", date: "", time: "", passengers, specialLuggage: "" }; }
function defaultState(apartment?: Apartment): FormState {
  return { checkIn: "", checkOut: "", adults: 2, children: 0, infants: 0,
    accommodationMode: apartment ? "selected_apartment" : "yakout_suggestion", apartmentId: apartment?.id ?? null,
    externalName: "", externalLocation: "", atmosphere: [], transferMode: "none", arrival: emptyFlight(2), departure: emptyFlight(2),
    driverSelected: false, driverType: "to_define", driverFrom: "", driverTo: "", driverNotes: "",
    serviceIds: [], serviceDetails: {}, name: "", phone: "", email: "", preferredChannel: "whatsapp", message: "", consent: false };
}
function days(start: string, end: string) {
  if (!start || !end) return 0;
  const [a,b] = [start,end].map((v) => { const [y,m,d] = v.split("-").map(Number); return Date.UTC(y,m-1,d); });
  return Math.max(0, Math.round((b-a)/86_400_000));
}
function displayDate(value: string) { if (!value) return "À préciser"; const [y,m,d]=value.split("-"); return `${d}/${m}/${y}`; }

export function StayComposer({ apartments, services, selectedApartment, selectedPackage }: { apartments: Apartment[]; services: Service[]; selectedApartment?: Apartment; selectedPackage?: PackageContext }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => {
    const initial = defaultState(selectedApartment);
    if (selectedApartment || selectedPackage || typeof window === "undefined") return initial;
    try {
      const saved = window.sessionStorage.getItem("yakout-stay-composer");
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch {
      return initial;
    }
  });
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [operationId] = useState(() => crypto.randomUUID());
  const [pending, startTransition] = useTransition();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const selected = apartments.find((item) => item.id === form.apartmentId) ?? selectedApartment;
  const nights = days(form.checkIn, form.checkOut);
  const totalGuests = form.adults + form.children + form.infants;
  const composerMode = selectedPackage ? "package_selected" : selectedApartment ? "apartment_selected" : "custom_stay";

  useEffect(() => { sessionStorage.setItem("yakout-stay-composer", JSON.stringify(form)); }, [form]);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateFlight = (kind: "arrival" | "departure", patch: Partial<Flight>) => setForm((current) => ({ ...current, [kind]: { ...current[kind], ...patch } }));

  const validation = useMemo(() => {
    if (step === 0) {
      if (!form.checkIn || !form.checkOut) return "Renseignez les dates du séjour.";
      if (nights < 1) return "La date de départ doit être après l’arrivée.";
      if (form.adults < 1) return "Au moins un adulte est nécessaire.";
    }
    if (step === 1) {
      if (form.accommodationMode === "selected_apartment" && !selected) return "Choisissez un appartement.";
      if (selected && form.adults + form.children > selected.capacity) return `Cet appartement accueille au maximum ${selected.capacity} voyageurs.`;
      if (form.accommodationMode === "external_accommodation" && form.externalName.trim().length < 2) return "Indiquez le nom de votre hébergement.";
    }
    if (step === 2) {
      const needsArrival = form.transferMode === "arrival" || form.transferMode === "round_trip";
      const needsDeparture = form.transferMode === "departure" || form.transferMode === "round_trip";
      if (needsArrival && (!form.arrival.date || !form.arrival.time)) return "Renseignez la date et l’heure du vol d’arrivée.";
      if (needsDeparture && (!form.departure.date || !form.departure.time)) return "Renseignez la date et l’heure du vol de départ.";
    }
    if (step === 4) {
      if (form.name.trim().length < 2 || form.phone.trim().length < 6) return "Renseignez votre nom et votre téléphone / WhatsApp.";
      if (form.preferredChannel === "email" && !form.email) return "Ajoutez votre e-mail pour être contacté par e-mail.";
      if (!form.consent) return "Votre accord est nécessaire pour vous recontacter.";
    }
    return "";
  }, [form, nights, selected, step]);

  const accommodationLabel = form.accommodationMode === "selected_apartment" ? selected?.title ?? "Appartement à choisir" : form.accommodationMode === "yakout_suggestion" ? "Proposition Yakout" : form.externalName || "Hébergement personnel";
  const routeLabel = form.accommodationMode === "selected_apartment" ? selected?.title : form.accommodationMode === "yakout_suggestion" ? "votre hébergement Yakout, à confirmer" : form.externalName;

  function next() { setError(validation); if (!validation) setStep((value) => Math.min(4, value + 1)); }
  function submit() {
    setError(validation); if (validation || pending) return;
    startTransition(async () => {
      const payload = {
        operationId, composerMode, packageId: selectedPackage?.id ?? null, apartmentId: selected?.id ?? null,
        stay: { checkIn: form.checkIn, checkOut: form.checkOut, adults: form.adults, children: form.children, infants: form.infants },
        accommodation: form.accommodationMode === "selected_apartment" ? { mode: "selected_apartment", apartmentId: selected!.id }
          : form.accommodationMode === "yakout_suggestion" ? { mode: "yakout_suggestion", preferences: { atmosphere: form.atmosphere } }
          : { mode: "external_accommodation", accommodationName: form.externalName, publicLocation: form.externalLocation || undefined },
        airportTransfer: form.transferMode === "none" ? { mode: "none" }
          : form.transferMode === "arrival" ? { mode: "arrival", arrival: form.arrival }
          : form.transferMode === "departure" ? { mode: "departure", departure: form.departure }
          : { mode: "round_trip", arrival: form.arrival, departure: form.departure },
        privateDriver: { selected: form.driverSelected, serviceType: form.driverSelected ? form.driverType : null, dateFrom: form.driverSelected && form.driverFrom ? form.driverFrom : null, dateTo: form.driverSelected && form.driverTo ? form.driverTo : null, notes: form.driverNotes || undefined },
        serviceIds: form.serviceIds, serviceDetails: form.serviceDetails,
        contact: { name: form.name, phone: form.phone, email: form.email, preferredChannel: form.preferredChannel }, message: form.message || undefined, consent: form.consent, pageUrl: window.location.href,
      };
      try {
        const response = await fetch("/api/stay-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const body = await response.json();
        if (!response.ok) { setError(body.error || "Votre demande n’a pas pu être envoyée. Vos informations ont été conservées, vous pouvez réessayer."); return; }
        sessionStorage.removeItem("yakout-stay-composer"); setReference(body.reference);
      } catch { setError("Votre demande n’a pas pu être envoyée. Vos informations ont été conservées, vous pouvez réessayer."); }
    });
  }

  if (reference) return <div className="container mx-auto max-w-3xl px-4 py-16 text-center"><CheckCircle2 className="mx-auto size-14 text-gold"/><h1 className="mt-6 font-display text-3xl font-semibold">Votre demande a bien été envoyée.</h1><p className="mt-3 text-muted-foreground">Référence de demande : <strong className="text-foreground">{reference}</strong></p><p className="mt-2 text-muted-foreground">{displayDate(form.checkIn)} → {displayDate(form.checkOut)} · {totalGuests} voyageur{totalGuests>1?"s":""} · {accommodationLabel}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/" className="rounded-sm border border-border px-5 py-3">Retour à l’accueil</Link><Link href="/apartments" className="rounded-sm bg-gold px-5 py-3 font-semibold text-primary-foreground">Voir les appartements</Link></div></div>;

  return <div className="container mx-auto px-4 py-8 md:px-8 lg:py-12">
    <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">Composez votre séjour</p><h1 className="mt-3 font-display text-3xl font-semibold text-foreground md:text-5xl">Une demande simple, adaptée à vos choix</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Cinq étapes courtes. L’équipe Yakout vérifiera ensuite les disponibilités et vous proposera un devis précis.</p></header>
    <nav aria-label="Progression" className="mb-8"><p className="mb-3 text-sm text-muted-foreground">Étape {step+1} sur 5 · <span className="text-foreground">{steps[step]}</span></p><ol className="grid grid-cols-5 gap-1">{steps.map((label,index)=><li key={label} aria-current={index===step?"step":undefined}><span className={`block h-1.5 rounded-full ${index<=step?"bg-gold":"bg-border"}`}/><span className="mt-2 hidden text-[11px] text-muted-foreground md:block">{label}</span></li>)}</ol></nav>
    {(selectedPackage || selectedApartment) && <div className="mb-6 rounded-sm border border-gold/30 bg-gold/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-gold">{selectedPackage?"Séjour sélectionné":"Appartement sélectionné"}</p><p className="mt-1 font-medium">{selectedPackage?.title ?? selectedApartment?.title}</p>{selectedPackage?.items?.length ? <p className="mt-1 text-sm text-muted-foreground">{selectedPackage.items.map(item=>item.title).join(" · ")}</p>:null}</div>}
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="rounded-sm border border-border bg-card p-5 shadow-elevation-1 md:p-8">
      {step===0 && <section aria-labelledby="stay-title" className="space-y-6"><div><h2 id="stay-title" className="font-display text-2xl font-semibold">Votre séjour</h2><p className="mt-1 text-sm text-muted-foreground">Quand venez-vous et qui voyage avec vous ?</p></div><div className="grid gap-4 sm:grid-cols-2"><DateField id="check-in" name="check-in" label="Date d’arrivée" value={form.checkIn} onChange={(v)=>set("checkIn",v??"")} required/><DateField id="check-out" name="check-out" label="Date de départ" value={form.checkOut} onChange={(v)=>set("checkOut",v??"")} required/></div><fieldset><legend className="mb-3 text-sm font-semibold">Voyageurs</legend><div className="grid gap-3 sm:grid-cols-3">{([["Adultes","adults",1],["Enfants","children",0],["Bébés","infants",0]] as const).map(([label,key,min])=><Counter key={key} label={label} value={form[key]} min={min} onChange={(v)=>set(key,v)}/>)}</div></fieldset>{nights>0&&<p className="rounded-sm bg-gold/5 p-4 text-sm"><strong>Du {displayDate(form.checkIn)} au {displayDate(form.checkOut)}</strong><br/>{nights} nuit{nights>1?"s":""} · {totalGuests} voyageur{totalGuests>1?"s":""}</p>}</section>}
      {step===1 && <section aria-labelledby="accommodation-title" className="space-y-6"><div><h2 id="accommodation-title" className="font-display text-2xl font-semibold">Hébergement</h2><p className="mt-1 text-sm text-muted-foreground">Nous ne demandons que ce qui n’est pas déjà connu.</p></div>{selectedApartment?<ApartmentCard apartment={selectedApartment}/>:<fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">Votre choix</legend>{apartments.length>0&&<Choice label="Choisir un appartement Yakout" checked={form.accommodationMode==="selected_apartment"} onChange={()=>set("accommodationMode","selected_apartment")}/>}<Choice label="Laisser Yakout me proposer un logement" checked={form.accommodationMode==="yakout_suggestion"} onChange={()=>{set("accommodationMode","yakout_suggestion");set("apartmentId",null)}}/><Choice label="J’ai déjà mon hébergement" checked={form.accommodationMode==="external_accommodation"} onChange={()=>{set("accommodationMode","external_accommodation");set("apartmentId",null)}}/></fieldset>}{!selectedApartment&&form.accommodationMode==="selected_apartment"&&<div className="grid gap-3 sm:grid-cols-2">{apartments.map(a=><label key={a.id} className={radioClass}><input type="radio" name="apartment" checked={form.apartmentId===a.id} onChange={()=>set("apartmentId",a.id)}/><span><strong className="block">{a.title}</strong><span className="text-xs text-muted-foreground">{a.district} · {a.bedrooms} chambre{a.bedrooms>1?"s":""} · {a.capacity} pers. max</span></span></label>)}</div>}{form.accommodationMode==="yakout_suggestion"&&<fieldset><legend className="mb-3 text-sm font-semibold">Ambiance souhaitée (facultatif)</legend><div className="flex flex-wrap gap-2">{["Centrale et urbaine","Calme","Traditionnelle","Premium","Familiale"].map(value=><label key={value} className="cursor-pointer rounded-full border border-border px-3 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/5"><input className="sr-only" type="checkbox" checked={form.atmosphere.includes(value)} onChange={()=>set("atmosphere",form.atmosphere.includes(value)?form.atmosphere.filter(v=>v!==value):[...form.atmosphere,value])}/>{value}</label>)}</div></fieldset>}{form.accommodationMode==="external_accommodation"&&<div className="grid gap-4 sm:grid-cols-2"><Field label="Hôtel, riad ou résidence" value={form.externalName} onChange={v=>set("externalName",v)} required/><Field label="Quartier ou localisation publique (facultatif)" value={form.externalLocation} onChange={v=>set("externalLocation",v)}/></div>}</section>}
      {step===2 && <section aria-labelledby="transport-title" className="space-y-7"><div><h2 id="transport-title" className="font-display text-2xl font-semibold">Transports et déplacements</h2><p className="mt-1 text-sm text-muted-foreground">Le transfert aéroport et le chauffeur privé répondent à deux besoins différents.</p></div><fieldset className="space-y-3"><legend className="mb-3 text-sm font-semibold">Souhaitez-vous un transfert aéroport ?</legend>{([['none','Aucun transfert'],['arrival','À l’arrivée'],['departure','Au départ'],['round_trip','Aller-retour']] as const).map(([value,label])=><Choice key={value} label={label} checked={form.transferMode===value} onChange={()=>set("transferMode",value)}/>)}</fieldset>{(form.transferMode==="arrival"||form.transferMode==="round_trip")&&<FlightFields title="Vol d’arrivée" value={form.arrival} stayDate={form.checkIn} onChange={p=>updateFlight("arrival",p)}/>} {(form.transferMode==="departure"||form.transferMode==="round_trip")&&<FlightFields title="Vol de départ" value={form.departure} stayDate={form.checkOut} onChange={p=>updateFlight("departure",p)}/>} {form.transferMode!=="none"&&<p className="rounded-sm bg-gold/5 p-4 text-sm">{form.transferMode==="departure"?`Prise en charge : ${routeLabel}.`:`Destination : ${routeLabel}.`} L’adresse privée n’est jamais demandée ici.</p>}<fieldset><legend className="mb-3 text-sm font-semibold">Chauffeur privé pendant le séjour</legend><Choice label="Oui, je souhaite un chauffeur" checked={form.driverSelected} onChange={()=>set("driverSelected",!form.driverSelected)}/>{form.driverSelected&&<div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Formule<select className={`${inputClass} mt-1`} value={form.driverType} onChange={e=>set("driverType",e.target.value as FormState["driverType"])}><option value="few_trips">Quelques trajets</option><option value="half_day">Demi-journée</option><option value="full_day">Journée complète</option><option value="multi_day">Plusieurs jours</option><option value="to_define">À définir avec Yakout</option></select></label><Field label="Besoins particuliers (facultatif)" value={form.driverNotes} onChange={v=>set("driverNotes",v)}/><p className="text-sm text-muted-foreground sm:col-span-2">Vous pourrez définir l’itinéraire avec l’équipe Yakout.</p></div>}</fieldset></section>}
      {step===3 && <section aria-labelledby="services-title" className="space-y-6"><div><h2 id="services-title" className="font-display text-2xl font-semibold">Services complémentaires</h2><p className="mt-1 text-sm text-muted-foreground">Seuls les services publiés par Yakout sont proposés.</p></div>{services.length?<div className="space-y-3">{services.map(service=><div key={service.id}><label className={radioClass}><input type="checkbox" checked={form.serviceIds.includes(service.id)} onChange={()=>set("serviceIds",form.serviceIds.includes(service.id)?form.serviceIds.filter(id=>id!==service.id):[...form.serviceIds,service.id])}/><span><strong className="block">{service.title}</strong>{service.description&&<span className="text-xs text-muted-foreground">{service.description}</span>}</span></label>{form.serviceIds.includes(service.id)&&<textarea aria-label={`Précisions pour ${service.title}`} className={`${inputClass} mt-2`} rows={2} placeholder="Précisions facultatives" value={form.serviceDetails[service.id]??""} onChange={e=>set("serviceDetails",{...form.serviceDetails,[service.id]:e.target.value})}/>}</div>)}</div>:<p className="rounded-sm border border-border p-4 text-sm text-muted-foreground">Aucun service complémentaire n’est publié actuellement. Vous pourrez préciser votre besoin dans le message final.</p>}</section>}
      {step===4 && <section aria-labelledby="contact-title" className="space-y-6"><div><h2 id="contact-title" className="font-display text-2xl font-semibold">Coordonnées et récapitulatif</h2><p className="mt-1 text-sm text-muted-foreground">Comment l’équipe Yakout peut-elle vous répondre ?</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Nom complet" value={form.name} onChange={v=>set("name",v)} required/><Field label="Téléphone / WhatsApp" value={form.phone} onChange={v=>set("phone",v)} type="tel" required/><Field label="E-mail (facultatif)" value={form.email} onChange={v=>set("email",v)} type="email"/><label className={labelClass}>Moyen de contact préféré<select className={`${inputClass} mt-1`} value={form.preferredChannel} onChange={e=>set("preferredChannel",e.target.value as FormState["preferredChannel"])}><option value="whatsapp">WhatsApp</option><option value="phone">Appel</option><option value="email">E-mail</option></select></label></div><label className={labelClass}>Message (facultatif)<textarea className={`${inputClass} mt-1`} rows={4} value={form.message} onChange={e=>set("message",e.target.value)}/></label><label className={radioClass}><input type="checkbox" checked={form.consent} onChange={e=>set("consent",e.target.checked)}/><span>J’accepte d’être contacté au sujet de cette demande. <Link href="/politique-de-confidentialite" className="text-gold underline">Politique de confidentialité</Link></span></label><button type="button" onClick={submit} disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold px-6 font-semibold text-primary-foreground disabled:opacity-50">{pending?<><Loader2 className="size-4 animate-spin"/>Envoi en cours…</>:"Envoyer ma demande de séjour"}</button><p className="text-center text-xs text-muted-foreground">L’équipe Yakout vérifiera les disponibilités et vous répondra rapidement.</p></section>}
      <p aria-live="polite" className={`mt-6 rounded-sm p-3 text-sm ${error?"bg-destructive/10 text-destructive":"sr-only"}`}>{error}</p><div className="mt-8 flex justify-between border-t border-border pt-6">{step>0?<button type="button" onClick={()=>{setError("");setStep(v=>v-1)}} className="flex min-h-11 items-center gap-2 rounded-sm border border-border px-4"><ArrowLeft className="size-4"/>Précédent</button>:<span/>}{step<4&&<button type="button" onClick={next} className="flex min-h-11 items-center gap-2 rounded-sm bg-gold px-5 font-semibold text-primary-foreground">Suivant<ArrowRight className="size-4"/></button>}</div>
    </div><aside className="hidden lg:block"><div className="sticky top-24 rounded-sm border border-border bg-card p-5 shadow-elevation-1"><Summary nights={nights} guests={totalGuests} accommodation={accommodationLabel} transfer={form.transferMode} driver={form.driverSelected} services={services.filter(s=>form.serviceIds.includes(s.id)).map(s=>s.title)} /></div></aside></div>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden" style={{paddingBottom:"max(.75rem,env(safe-area-inset-bottom))"}}><button className="flex min-h-11 w-full items-center justify-between" onClick={()=>setSummaryOpen(v=>!v)} aria-expanded={summaryOpen}><span className="font-semibold">Récapitulatif</span><span className="flex items-center gap-2 text-sm text-gold">Devis à confirmer <ChevronDown className={`size-4 transition ${summaryOpen?"rotate-180":""}`}/></span></button>{summaryOpen&&<div className="max-h-[55vh] overflow-auto border-t border-border pt-3"><Summary nights={nights} guests={totalGuests} accommodation={accommodationLabel} transfer={form.transferMode} driver={form.driverSelected} services={services.filter(s=>form.serviceIds.includes(s.id)).map(s=>s.title)} /></div>}</div><div className="h-16 lg:hidden"/>
  </div>;
}

function Counter({label,value,min,onChange}:{label:string;value:number;min:number;onChange:(v:number)=>void}) { return <div className="flex min-h-12 items-center justify-between rounded-sm border border-border px-3"><span className="text-sm">{label}</span><span className="flex items-center gap-3"><button type="button" aria-label={`Diminuer ${label}`} disabled={value<=min} onClick={()=>onChange(value-1)} className="size-11 text-xl disabled:opacity-30">−</button><strong>{value}</strong><button type="button" aria-label={`Augmenter ${label}`} onClick={()=>onChange(value+1)} className="size-11 text-xl">+</button></span></div>; }
function Choice({label,checked,onChange}:{label:string;checked:boolean;onChange:()=>void}) { return <label className={radioClass}><input type="radio" checked={checked} onChange={onChange}/><span>{label}</span></label>; }
function Field({label,value,onChange,required,type="text"}:{label:string;value:string;onChange:(v:string)=>void;required?:boolean;type?:string}) { return <label className={labelClass}>{label}{required&&<span className="text-destructive"> *</span>}<input className={`${inputClass} mt-1`} type={type} value={value} onChange={e=>onChange(e.target.value)} required={required}/></label>; }
function ApartmentCard({apartment}:{apartment:Apartment}) { return <div className="grid overflow-hidden rounded-sm border border-border sm:grid-cols-[160px_1fr]">{apartment.imageUrl&&<div className="relative min-h-32"><Image src={apartment.imageUrl} alt={apartment.title} fill className="object-cover" sizes="160px"/></div>}<div className="p-4"><strong>{apartment.title}</strong><p className="mt-1 text-sm text-muted-foreground">{apartment.district} · {apartment.bedrooms} chambre{apartment.bedrooms>1?"s":""} · {apartment.capacity} voyageurs max</p><p className="mt-2 text-sm text-gold">{apartment.pricePerNight&&apartment.pricePerNight>0?`À partir de ${apartment.pricePerNight.toLocaleString("fr-FR")} MAD / nuit`:"Tarif à confirmer"}</p><Link className="mt-3 inline-block text-sm underline" href={`/apartments/${apartment.slug}`}>Voir l’appartement</Link></div></div>; }
function FlightFields({title,value,stayDate,onChange}:{title:string;value:Flight;stayDate:string;onChange:(p:Partial<Flight>)=>void}) { const mismatch=value.date&&stayDate&&value.date!==stayDate; return <fieldset className="rounded-sm border border-border p-4"><legend className="px-2 font-semibold">{title}</legend><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Aéroport<input className={`${inputClass} mt-1`} value="Marrakech-Ménara (RAK)" disabled/></label><Field label="Compagnie (facultatif)" value={value.airline} onChange={v=>onChange({airline:v})}/><Field label="Numéro de vol (facultatif)" value={value.flightNumber} onChange={v=>onChange({flightNumber:v})}/><DateField id={`${title}-date`} name={`${title}-date`} label="Date du vol" value={value.date} onChange={v=>onChange({date:v??""})} required/><Field label="Heure" value={value.time} onChange={v=>onChange({time:v})} type="time"/><label className={labelClass}>Passagers<input className={`${inputClass} mt-1`} type="number" min={1} value={value.passengers} onChange={e=>onChange({passengers:Number(e.target.value)||1})}/></label></div>{mismatch&&<p className="mt-3 text-sm text-gold">La date du vol est différente de la date du séjour. Vérifiez que ce choix est volontaire.</p>}</fieldset>; }
function Summary({nights,guests,accommodation,transfer,driver,services}:{nights:number;guests:number;accommodation:string;transfer:TransferMode;driver:boolean;services:string[]}) { const transferLabel={none:"Aucun",arrival:"Arrivée",departure:"Départ",round_trip:"Aller-retour"}[transfer]; return <div className="space-y-4 text-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gold">Votre demande</p><div><strong>Séjour</strong><p className="text-muted-foreground">{nights?`${nights} nuit${nights>1?"s":""}`:"Dates à préciser"} · {guests} voyageur{guests>1?"s":""}</p></div><div><strong>Hébergement</strong><p className="text-muted-foreground">{accommodation}</p></div><div><strong>Transfert aéroport</strong><p className="text-muted-foreground">{transferLabel}</p></div>{driver&&<div><strong>Déplacements</strong><p className="text-muted-foreground">Chauffeur privé</p></div>}{services.length>0&&<div><strong>Services</strong><p className="text-muted-foreground">{services.join(" · ")}</p></div>}<div className="border-t border-border pt-4"><strong>Prix</strong><p className="text-gold">Devis personnalisé après vérification</p><p className="mt-1 text-xs text-muted-foreground">Aucune valeur inconnue n’est comptée comme zéro.</p></div></div>; }
