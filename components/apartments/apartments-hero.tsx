import Image from "next/image";
import { yakoutImages, yakoutImageAlts } from "@/lib/images";

export function ApartmentsHero() {
  return (
    <section className="relative flex min-h-[55vh] items-end overflow-hidden md:min-h-[68vh]">
      <div className="absolute inset-0">
        <Image
          src={yakoutImages.hero}
          alt={yakoutImageAlts.hero}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410] via-[#1a1410]/60 to-transparent" />
      </div>
      <div className="relative z-10 w-full pb-16 pt-32 md:pb-24 md:pt-48">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-2xl">
            <span className="ruby-diamond" />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/90">
              Séjours privés à Marrakech
            </p>
            <h1 className="mt-4 font-display text-[clamp(1.8rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Des appartements sélectionnés pour vivre Marrakech autrement
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/70">
              Découvrez des appartements confortables, bien situés et accompagnés par les services Yakout&nbsp;: transport privé, assistance et expériences sur mesure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
