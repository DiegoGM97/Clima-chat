"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return <Button onClick={logout}>Cerrar sesion</Button>;
}
