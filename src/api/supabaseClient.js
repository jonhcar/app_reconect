// ============================================================
// supabaseClient.js — camada de API do app (Supabase)
// Expõe o objeto "base44" com a mesma forma da API original
// (entities.X.list/filter/get/create/update/delete, auth, etc.)
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------
// Helper genérico de entidade
// ------------------------------------------------------------
function makeEntity(table) {
  return {
    async list(orderBy) {
      let q = supabase.from(table).select("*");
      if (orderBy) q = q.order(orderBy.replace("-", ""), { ascending: !orderBy.startsWith("-") });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async filter(filters = {}, orderBy, limit) {
      let q = supabase.from(table).select("*");
      Object.entries(filters).forEach(([key, value]) => {
        q = q.eq(key, value);
      });
      if (orderBy) q = q.order(orderBy.replace("-", ""), { ascending: !orderBy.startsWith("-") });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    async create(payload) {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, payload) {
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async upsert(payload, onConflict) {
      const { data, error } = await supabase.from(table).upsert(payload, { onConflict }).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  };
}

// ------------------------------------------------------------
// Auth (Supabase Auth)
// ------------------------------------------------------------
const auth = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return { id: user.id, email: user.email, ...profile };
  },

  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  // Passo 1 do cadastro: cria o usuário; Supabase envia e-mail com código OTP
  // (No painel: Authentication > Email Templates > Confirm signup,
  //  troque {{ .ConfirmationURL }} por {{ .Token }} para virar código de 6 dígitos)
  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });
    if (error) throw error;
    return data;
  },

  // Passo 2: confirma o código de 6 dígitos recebido por e-mail
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });
    if (error) throw error;
    return { access_token: data?.session?.access_token };
  },

  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) throw error;
  },

  setToken(accessToken) {
    // Supabase já guarda a sessão sozinho após verifyOtp/signIn.
    return accessToken;
  },

  loginWithProvider(provider, redirectPath = "/") {
    return supabase.auth.signInWithOAuth({
      provider, // "google"
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
  },

  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async resetPassword({ newPassword }) {
    // Ao clicar no link do e-mail, o Supabase já autentica a sessão temporária.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async updateMe(payload) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async logout(redirectPath = "/login") {
    await supabase.auth.signOut();
    window.location.href = redirectPath;
  },
};

// ------------------------------------------------------------
// Integrations: Storage / Email / LLM (via Netlify Functions)
// ------------------------------------------------------------
const Core = {
  async UploadFile({ file }) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage.from("uploads").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return { file_url: data.publicUrl };
  },

  async SendEmail({ to, subject, body }) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ to, subject, body }),
    });
    if (!res.ok) throw new Error("Failed to send email");
    return res.json();
  },

  async InvokeLLM(payload) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/.netlify/functions/invoke-llm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to invoke LLM");
    return res.json();
  },
};

// ------------------------------------------------------------
// Agents: conversas do "Alma" (Realtime + Netlify Function)
// ------------------------------------------------------------
const agents = {
  async listConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("alma_conversations")
      .select("*, alma_messages(*)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map((c) => ({
      id: c.id,
      metadata: { name: c.name },
      messages: c.alma_messages,
    }));
  },

  async createConversation({ metadata } = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("alma_conversations")
      .insert({ user_id: user.id, name: metadata?.name || "Nueva conversación" })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, metadata: { name: data.name }, messages: [] };
  },

  async getConversation(id) {
    const { data, error } = await supabase
      .from("alma_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { id, messages: data };
  },

  async addMessage(conv, { role, content }) {
    await supabase.from("alma_messages").insert({ conversation_id: conv.id, role, content });
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/.netlify/functions/alma-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ conversation_id: conv.id, content }),
    });
    if (!res.ok) throw new Error("Failed to get Alma response");
    return res.json();
  },

  subscribeToConversation(conversationId, callback) {
    const channel = supabase
      .channel(`alma_messages_${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alma_messages", filter: `conversation_id=eq.${conversationId}` },
        async () => {
          const { data } = await supabase
            .from("alma_messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });
          callback({ messages: data });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};

// ------------------------------------------------------------
// Objeto final
// ------------------------------------------------------------
export const base44 = {
  auth,
  entities: {
    Product: makeEntity("products"),
    Module: makeEntity("modules"),
    Access: makeEntity("access"),
    Progress: makeEntity("progress"),
    Favorite: makeEntity("favorites"),
    Review: makeEntity("reviews"),
    AppSettings: makeEntity("app_settings"),
    Category: makeEntity("categories"),
    QuizResult: makeEntity("quiz_results"),
    DailyQuiz: makeEntity("daily_quizzes"),
    DailyQuizResult: makeEntity("daily_quiz_results"),
    JournalEntry: makeEntity("journal_entries"),
    ReadingProgress: makeEntity("reading_progress"),
  },
  integrations: { Core },
  agents,
};
