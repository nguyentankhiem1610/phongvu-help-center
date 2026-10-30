"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Wrench,
  Users,
  X,
  UserRound,
} from "lucide-react";
import { useApp } from "./app-provider";
import {
  userHome,
  isTechnicianApplicant,
  roleLabels,
  roleNavigation,
  type NavigationItem,
} from "@/views/navigation";
import type { Role } from "@/types/entities";

const icons = {
  overview: LayoutDashboard,
  appointments: CalendarDays,
  jobs: Wrench,
  parts: Cpu,
  booking: CalendarDays,
  track: Search,
  services: ClipboardList,
  technicians: Users,
  application: ClipboardList,
  profile: UserRound,
};

export function RoleWorkspace({ children }: { children: React.ReactNode }) {
  const { data, act, notify } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const user = data.user!;
  const role = user.role;
  const applicant =
    isTechnicianApplicant(user) ||
    (role === "customer" && pathname === "/staff-application");
  const label = applicant ? "Hồ sơ kỹ thuật" : roleLabels[role];
  const navigation: NavigationItem[] = applicant
    ? [
        {
          href: "/staff-application",
          label: "Hồ sơ của tôi",
          icon: "application",
        },
      ]
    : roleNavigation[role];
  const descriptions: Record<Role, string> = {
    manager: "Quản lý & điều phối dịch vụ",
    technician: "Xử lý thiết bị & cập nhật tiến độ",
    customer: "Đặt lịch & chăm sóc thiết bị",
  };
  return (
    <div className={`role-app role-${role}`}>
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      <header className="role-header">
        <div className="container role-header-inner">
          <Link
            className="brand"
            href={userHome(user)}
            aria-label="Phong Vũ Help Center"
          >
            <Image src="/phongvu-logo.svg" alt="PHONG VŨ" width={320} height={45} />
            <span>HELP CENTER</span>
          </Link>
          <span className="role-chip">
            <ShieldCheck size={15} />
            {label}
          </span>
          <span className="role-header-description">
            {applicant ? "Hoàn tất hồ sơ & chờ phê duyệt" : descriptions[role]}
          </span>
          <button
            className="role-menu-toggle"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="role-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button
            className="role-logout"
            aria-label="Đăng xuất"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await act("logout");
                router.replace("/login");
                notify("Đã đăng xuất.");
              } catch (error) {
                notify((error as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <LogOut size={16} />
            <span>{busy ? "Đang thoát…" : "Đăng xuất"}</span>
          </button>
        </div>
      </header>
      <div className="container role-layout">
        <aside className={`role-sidebar${open ? " is-open" : ""}`}>
          <div className="role-sidebar-heading">
            <span>KHÔNG GIAN {label.toLocaleUpperCase("vi")}</span>
            <p>
              {applicant
                ? "Đăng ký trở thành kỹ thuật viên"
                : descriptions[role]}
            </p>
          </div>
          <nav id="role-navigation" aria-label={`Menu ${label}`}>
            {[
              ...navigation,
              { href: "/profile", label: "Hồ sơ cá nhân", icon: "profile" },
            ].map((item) => {
              const Icon = icons[item.icon as keyof typeof icons];
              const active = pathname === item.href;
              const pending =
                role === "manager" && item.icon === "appointments"
                  ? data.appointments.filter((a) => a.status === "pending")
                      .length
                  : role === "manager" && item.icon === "technicians"
                    ? (data.technician_applications || []).filter(
                        (a) => a.status === "pending",
                      ).length
                    : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "active" : ""}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {pending > 0 && <small>{pending}</small>}
                </Link>
              );
            })}
          </nav>
          <div className="role-profile">
            <span className="avatar">{user.full_name.slice(0, 1)}</span>
            <div>
              <strong>{user.full_name}</strong>
              <span>
                {applicant ? "Chờ cấp quyền kỹ thuật viên" : roleLabels[role]}
              </span>
            </div>
          </div>
        </aside>
        <main id="main" className="role-main" key={role}>
          {children}
        </main>
      </div>
      <div className="container role-footer">
        Phong Vũ Help Center · Trung tâm dịch vụ
      </div>
    </div>
  );
}
