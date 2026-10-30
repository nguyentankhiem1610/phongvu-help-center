"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Snapshot, Profile } from "@/types/entities";
import { seedDatabase } from "@/views/preview/sample-data";
import { userHome } from "@/views/navigation";

type PreviewRole =
  "guest" | "customer" | "manager" | "technician" | "application";
type Context = {
  data: Snapshot;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  act: (action: string, payload?: unknown) => Promise<Record<string, unknown>>;
  notify: (message: string) => void;
};
const AppContext = createContext<Context | null>(null);
const identities: Record<Exclude<PreviewRole, "guest">, string> = {
  customer: "demo-customer",
  manager: "demo-manager",
  technician: "demo-tech",
  application: "demo-applicant",
};
export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<PreviewRole>("guest");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const fixture = useMemo(() => {
    const source = seedDatabase();
    source.profiles.push({
      id: "demo-applicant",
      full_name: "Phạm Tuấn Minh",
      email: "ungvien@example.invalid",
      phone: "0905555555",
      role: "customer",
      technician_status: "pending",
    });
    source.technician_applications = [
      {
        user_id: "demo-applicant",
        full_name: "Phạm Tuấn Minh",
        email: "ungvien@example.invalid",
        phone: "0905555555",
        specialization: "Sửa chữa phần cứng laptop",
        experience_years: 2,
        introduction: "Có kinh nghiệm kiểm tra và bảo trì laptop văn phòng.",
        status: "pending",
        review_note: "",
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    return source;
  }, []);
  const user: Profile | null =
    role === "guest"
      ? null
      : fixture.profiles.find((p) => p.id === identities[role]) || null;
  const data = useMemo<Snapshot>(() => {
    const tickets =
      !user || user.role === "manager"
        ? fixture.tickets
        : fixture.tickets.filter((t) =>
            user.role === "technician"
              ? t.technician_id === user.id
              : fixture.appointments.some(
                  (a) => a.id === t.appointment_id && a.customer_id === user.id,
                ),
          );
    const appointments = !user
      ? []
      : user.role === "manager"
        ? fixture.appointments
        : fixture.appointments.filter((a) =>
            user.role === "customer"
              ? a.customer_id === user.id
              : tickets.some((t) => t.appointment_id === a.id),
          );
    return {
      ...fixture,
      user,
      mode: "frontend",
      auth_provider: "application",
      appointments,
      tickets: user ? tickets : [],
      events: fixture.events.filter((e) =>
        appointments.some((a) => a.id === e.appointment_id),
      ),
    };
  }, [fixture, user]);
  useEffect(() => {
    const pathname = window.location.pathname;
    setRole(
      pathname.startsWith("/admin") || pathname.startsWith("/dashboard")
        ? "manager"
        : pathname.startsWith("/technician")
          ? "technician"
          : pathname.startsWith("/staff-application")
            ? "application"
            : ["/customer", "/profile", "/account", "/booking", "/track"].some(
                  (p) => pathname.startsWith(p),
                )
              ? "customer"
              : "guest",
    );
    setLoading(false);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function act(
    action: string,
    payload: unknown = {},
  ): Promise<Record<string, unknown>> {
    if (action === "logout") {
      setRole("guest");
      return { ok: true };
    }
    if (["login", "register", "staff_login"].includes(action)) {
      const input = payload as { username?: string };
      const nextRole =
        action === "staff_login"
          ? input.username?.toLowerCase().startsWith("technical")
            ? "technician"
            : "manager"
          : "customer";
      const target = fixture.profiles.find(
        (p) => p.id === identities[nextRole],
      )!;
      setRole(nextRole);
      return { ok: true, verification: false, redirectTo: userHome(target) };
    }
    throw new Error(
      "Bản giao diện chỉ dùng dữ liệu mẫu. Thao tác này chưa lưu dữ liệu vì chưa kết nối backend.",
    );
  }
  function choose(next: PreviewRole) {
    setRole(next);
    router.push(
      next === "guest"
        ? "/"
        : next === "application"
          ? "/staff-application"
          : next === "manager"
            ? "/admin"
            : next === "technician"
              ? "/technician"
              : "/customer",
    );
  }
  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        error: "",
        refresh: async () => {},
        act,
        notify: setNotice,
      }}
    >
      {children}
      <aside
        className="preview-toolbar"
        aria-label="Xem giao diện theo vai trò"
      >
        <span>
          <strong>BẢN GIAO DIỆN</strong>
          <small>Dữ liệu mẫu · Chưa kết nối backend</small>
        </span>
        <label>
          Vai trò{" "}
          <select
            value={role}
            onChange={(e) => choose(e.target.value as PreviewRole)}
          >
            <option value="guest">Trang công khai</option>
            <option value="customer">Khách hàng</option>
            <option value="manager">Admin</option>
            <option value="technician">Kỹ thuật viên</option>
            <option value="application">Hồ sơ kỹ thuật viên</option>
          </select>
        </label>
      </aside>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Missing AppProvider");
  return value;
}
