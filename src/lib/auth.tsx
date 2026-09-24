import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, Role } from "./types";

const STORAGE_KEY = "smartgym.auth";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string, role: Role) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeRole = (role?: string): Role => (role?.toUpperCase() === "ADMIN" ? "ADMIN" : "MEMBER");

const demoUsers: Record<Role, AuthUser> = {
  ADMIN: {
    id: "A-1",
    name: "Ravi Deshmukh",
    email: "admin@smartgym.in",
    role: "ADMIN",
    avatarInitials: "RD",
  },
  MEMBER: {
    id: "M-1000",
    name: "Rahul Sharma",
    email: "rahul@smartgym.in",
    role: "MEMBER",
    avatarInitials: "RS",
  },
};

const parseStoredUser = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed || !parsed.email) return null;

    return {
      ...parsed,
      role: normalizeRole(parsed.role),
      avatarInitials: parsed.avatarInitials ?? (parsed.name ?? "U").slice(0, 2).toUpperCase(),
    } as AuthUser;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(parseStoredUser());
    setReady(true);
  }, []);

  const signIn = useCallback(async (email: string, password: string, role: Role) => {
    const normalizedEmail = email.trim().toLowerCase();
    const demoUser = demoUsers[role];

    if (normalizedEmail === demoUser.email.toLowerCase() && password === "demo1234") {
      window.localStorage.setItem("smartgym.token", `${role.toLowerCase()}-demo-token`);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }

    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    const next: AuthUser = {
      id: String(data.user?.id ?? data.user?._id ?? crypto.randomUUID()),
      name: data.user?.name ?? "Gym User",
      email: data.user?.email ?? normalizedEmail,
      role: normalizeRole(data.user?.role),
      avatarInitials: data.user?.avatarInitials ?? (data.user?.name ?? "GU").slice(0, 2).toUpperCase(),
    };

    window.localStorage.setItem("smartgym.token", data.token ?? `${next.role.toLowerCase()}-token`);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("smartgym.token");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
