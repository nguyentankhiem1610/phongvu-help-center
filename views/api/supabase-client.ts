import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

export const hasSupabaseEnvironment = Boolean(url || key);
let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (!url || !key || url.includes("your-project") || key.includes("your_key")) {
    throw new Error("Chưa cấu hình Supabase: điền Project URL và Publishable key thật vào .env.local, rồi khởi động lại npm run dev.");
  }
  let parsed: URL;
  try { parsed = new URL(url); } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL không phải URL hợp lệ.");
  }
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Supabase URL cần bắt đầu bằng https:// hoặc http://.");
  }
  if (!key.startsWith("sb_publishable_") && !key.startsWith("eyJ")) {
    throw new Error("Dùng Publishable key của Supabase cho cấu hình trình duyệt.");
  }
  if (key.startsWith("eyJ")) {
    try {
      const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      if (JSON.parse(atob(payload)).role !== "anon") throw new Error();
    } catch {
      throw new Error("Khóa JWT cũ phải là anon public. Không dùng service_role key cho trình duyệt.");
    }
  }
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
