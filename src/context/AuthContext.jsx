import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44, supabase } from "../api/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refreshUser();
      else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, isAdmin: user?.role === "admin", isPremium: !!user?.premium }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
