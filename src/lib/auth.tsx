import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const NIL = "00000000-0000-0000-0000-000000000000";

export type Child = { id: string; name: string; age_group: string };
type Profile = { id: string; display_name: string; notify_new_episode: boolean };

type AuthCtx = {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  children: Child[];
  activeChildId: string; // NIL = parent account
  activeName: string;
  setActiveChild: (id: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children: kids }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [childList, setChildList] = useState<Child[]>([]);
  const [activeChildId, setActive] = useState(NIL);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) {
      setProfile(null);
      setIsAdmin(false);
      setChildList([]);
      setReady(true);
      return;
    }
    const [p, r, c] = await Promise.all([
      supabase.from("profiles").select("id, display_name, notify_new_episode").eq("id", u.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.id),
      supabase.from("child_profiles").select("id, name, age_group").order("created_at"),
    ]);
    setProfile(p.data ?? null);
    setIsAdmin(!!r.data?.some((x) => x.role === "admin"));
    const list = c.data ?? [];
    setChildList(list);
    const stored = localStorage.getItem(`ska-child-${u.id}`);
    setActive(stored && list.some((x) => x.id === stored) ? stored : NIL);
    setReady(true);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        setTimeout(() => load(session?.user ?? null), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const setActiveChild = (id: string) => {
    setActive(id);
    if (user) localStorage.setItem(`ska-child-${user.id}`, id);
  };

  const activeName =
    activeChildId === NIL
      ? profile?.display_name ?? user?.email ?? ""
      : childList.find((c) => c.id === activeChildId)?.name ?? "";

  return (
    <Ctx.Provider
      value={{
        ready,
        user,
        profile,
        isAdmin,
        children: childList,
        activeChildId,
        activeName,
        setActiveChild,
        refresh: async () => {
          const { data } = await supabase.auth.getUser();
          await load(data.user);
        },
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {kids}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
