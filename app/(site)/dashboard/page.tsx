import Link from "next/link";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const shortcuts = [
  {
    href: "/artikli",
    title: "Artikli",
    description: "Pregled i upravljanje inventarom.",
  },
  {
    href: "/artikli/novi",
    title: "Novi artikal",
    description: "Brzi unos novog artikla u skladište.",
  },
  {
    href: "/statistika",
    title: "Statistika",
    description: "Pregled ključnih podataka i trendova.",
  },
];

export default function UserDashboardPage() {
  return (
    <section className="container mx-auto max-w-5xl space-y-8 px-4 py-10 sm:space-y-10 sm:py-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <LayoutGrid className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moj pregled</h1>
            <p className="mt-1 text-muted-foreground">Brze prečice do glavnih funkcija aplikacije.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="group block h-full">
            <Card
              className={cn(
                "h-full border bg-card shadow-md transition-all duration-200",
                "rounded-2xl hover:scale-[1.02] hover:border-primary/30 hover:shadow-lg",
              )}
            >
              <CardHeader className="space-y-2 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold leading-snug">{item.title}</CardTitle>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </div>
                <CardDescription className="text-muted-foreground">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-sm font-medium text-primary">Otvori</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
