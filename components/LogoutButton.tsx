"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={logout}
      disabled={loading}
      className="h-11 rounded-2xl border-borda/80 bg-white text-textoSec hover:bg-rosaClaro dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-secondary"
      aria-label="Sair"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
