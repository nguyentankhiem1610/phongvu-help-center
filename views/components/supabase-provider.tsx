"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { checkSignupSettings, getSupabaseClient } from "@/views/api/supabase-client";
import { authError, performAuthAction } from "@/views/api/auth-actions";
import { emptySnapshot, loadSupabaseSnapshot } from "@/views/api/supabase-snapshot";
import { AppContext } from "./app-context";

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => ({ data: emptySnapshot(), loading: true, error: "" }));
  const [notice, setNotice] = useState("");
  const revision = useRef(0);
  const authOperation = useRef(false);
  const invalidate = useCallback(() => { revision.current++; }, []);
  const refresh = useCallback(async () => {
    const request = ++revision.current;
    try {
      const data = await loadSupabaseSnapshot(getSupabaseClient());
      if (request === revision.current) setState({ data, loading: false, error: "" });
    } catch (error) {
      if (request === revision.current) setState({ data: emptySnapshot(), loading: false, error: authError(error).message });
      throw error;
    }
  }, []);
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    function scheduleRefresh() {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (authOperation.current) return;
        void refresh().catch(() => {});
      }, 0);
      timers.add(timer);
    }
    try {
      const { data } = getSupabaseClient().auth.onAuthStateChange(() => {
        // Callback dong bo; tranh goi Auth API ben trong Auth event lock.
        scheduleRefresh();
      });
      return () => {
        data.subscription.unsubscribe();
        timers.forEach(clearTimeout);
        invalidate();
      };
    } catch {
      scheduleRefresh(); // refresh hien loi cau hinh, khong quay ve dang nhap gia lap.
      return () => { timers.forEach(clearTimeout); invalidate(); };
    }
  }, [refresh, invalidate]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function act(action: string, payload: unknown = {}): Promise<Record<string, unknown>> {
    authOperation.current = true;
    revision.current++;
    try {
      // Kiem tra truoc signUp de khong tao tai khoan cho xac nhan/gui thu ngoai y muon.
      if (action === "register") await checkSignupSettings();
      const result = await performAuthAction(getSupabaseClient(), action,
        payload as Record<string, unknown>, window.location.origin);
      await refresh();
      return result;
    } catch (error) {
      // Xoa trang thai cu neu dang nhap nhan vien bi tu choi va da signOut.
      void refresh().catch(() => {});
      throw error;
    } finally {
      authOperation.current = false;
    }
  }
  return (
    <AppContext.Provider value={{ ...state, refresh, act, notify: setNotice }}>
      {children}
      {notice && <div className="toast" role="status">{notice}
        <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>×</button>
      </div>}
    </AppContext.Provider>
  );
}
