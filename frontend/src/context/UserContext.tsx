"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/orm_service";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  companyName:string;
  login:string;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
    const res = await apiFetch({ url:"/auth/user",method:'GET'});
      if (res?.ok) {
        const data = await res.json();
        setUser(data);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
