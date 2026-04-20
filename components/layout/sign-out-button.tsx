"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signOut = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isLoading}
      onClick={() => void signOut()}
      className="gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <LogOut className="size-3.5" aria-hidden />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
