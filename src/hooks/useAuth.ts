import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const EMAIL_DOMAIN = "@research.local";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (username: string, password: string) => {
    const email = `${username.toLowerCase().trim()}${EMAIL_DOMAIN}`;
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      // Handle duplicate user error
      if (error.message.includes("already registered")) {
        return { data: null, error: { message: "This username is already taken. Please choose another." } };
      }
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signIn = async (username: string, password: string) => {
    const email = `${username.toLowerCase().trim()}${EMAIL_DOMAIN}`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { data: null, error: { message: "Invalid username or password." } };
      }
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Extract username from email
  const username = user?.email?.replace(EMAIL_DOMAIN, "") ?? null;

  return {
    user,
    session,
    loading,
    username,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!session,
  };
}
