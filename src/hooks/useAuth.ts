import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const OWNER_EMAIL = (
  import.meta.env.VITE_ADMIN_OWNER_EMAIL ?? "luiznovakiresner228@gmail.com"
).toLowerCase();

function withTimeout<T>(promise: Promise<T>, ms = 8000, label = "Supabase") {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} demorou para responder.`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    withTimeout(supabase.auth.getSession(), 8000, "Sessao administrativa")
      .then(({ data: { session: s } }) => {
        if (!active) return;
        setSession(s);
        setUser(s?.user ?? null);
      })
      .catch((error) => {
        console.warn("[Auth] Falha ao recuperar sessao:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      return () => {
        active = false;
      };
    }
    if (user.email?.toLowerCase() === OWNER_EMAIL) {
      setIsAdmin(true);
      return () => {
        active = false;
      };
    }
    withTimeout(
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle(),
      8000,
      "Permissao administrativa",
    )
      .then(({ data, error }) => {
        if (active) setIsAdmin(!error && !!data);
      })
      .catch((error) => {
        console.warn("[Auth] Falha ao validar permissao administrativa:", error);
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  return { session, user, loading, isAdmin };
}
