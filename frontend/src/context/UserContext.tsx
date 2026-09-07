"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/orm_service";
import type { EffectiveAccess } from "@/types/access";

export type CurrentUser = {
  _id: string;
  name?: string;
  email: string;
  role?: string;
  companyIds: string[];
  groupIds: string[];
  allowedToAllCompanies: boolean;
  access: EffectiveAccess;
  login: string;
  hasAvatar?: boolean;
  updatedAt?: string;
};

type UserContextType = {
  user: CurrentUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await apiFetch({ url:"/auth/user",method:'GET'});
    if (res?.ok) {
      const data = await res.json() as CurrentUser;
      setUser(data);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      await refreshUser();
      setLoading(false);
    };

    void loadUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
