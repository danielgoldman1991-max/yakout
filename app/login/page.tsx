import { redirect } from "next/navigation";
import { signInWithPassword } from "@/lib/auth/actions";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { YakoutLogo } from "@/components/branding/YakoutLogo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: errorParam } = await searchParams;
  const configured = hasSupabaseEnv();
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard/ecosystem");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-glow-pulse rounded-full bg-gold/3 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 animate-glow-pulse rounded-full bg-gold/3 blur-3xl [animation-delay:2s]" />
      </div>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md border-border bg-card/80 shadow-elevation-3 backdrop-blur-xl">
        <CardHeader className="text-center">
          <YakoutLogo size="lg" priority className="mx-auto" />
          <CardTitle className="pt-4 text-2xl">Espace équipe</CardTitle>
          <CardDescription>Connexion sécurisée à Yakout Digital Ecosystem V1.</CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <div className="rounded-sm border border-gold/20 bg-gold/5 p-4 text-sm text-gold">
              Supabase n&apos;est pas encore configuré. Renseignez les variables d&apos;environnement, puis l&apos;équipe pourra se connecter.
            </div>
          ) : (
            <form action={signInWithPassword} className="space-y-4">
              <Input name="email" type="email" placeholder="Email" required className="focus-visible:ring-2 focus-visible:ring-ring" />
              <Input name="password" type="password" placeholder="Mot de passe" required className="focus-visible:ring-2 focus-visible:ring-ring" />
              {errorParam ? <p className="text-sm text-red-400">{errorParam}</p> : null}
              <Button type="submit" className="w-full shadow-elevation-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-3 hover:shadow-glow-gold">Se connecter</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
