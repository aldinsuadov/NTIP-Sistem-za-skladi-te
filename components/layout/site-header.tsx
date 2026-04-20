import Link from "next/link";
import { cookies } from "next/headers";
import { Package } from "lucide-react";
import { verifyAuthToken } from "@/lib/auth";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const authToken = (await cookies()).get("auth_token")?.value;
  const session = authToken ? await verifyAuthToken(authToken) : null;
  const isAdmin = session?.role === "ADMIN";
  const isUser = session?.role === "USER";
  const isAuthenticated = session !== null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-semibold tracking-tight transition-opacity hover:opacity-90"
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-xl",
              "bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform group-hover:scale-105",
            )}
          >
            <Package className="size-[1.15rem]" aria-hidden />
          </span>
          Špajz
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm text-muted-foreground sm:gap-x-6">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
              >
                Dashboard
              </Link>
            )}
            {isUser && (
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
              >
                Moj pregled
              </Link>
            )}
            <Link
              href="/artikli"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
            >
              Artikli
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
              >
                Odobravanja
              </Link>
            )}
            <Link
              href="/statistika"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
            >
              Statistika
            </Link>
          </nav>
          {isAuthenticated && <SignOutButton />}
        </div>
      </div>
    </header>
  );
}
