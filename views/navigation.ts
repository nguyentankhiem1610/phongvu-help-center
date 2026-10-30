import type { Profile, Role, TechnicianStatus } from "@/types/entities";

export type WorkspaceSection = "overview" | "appointments" | "jobs" | "parts";
export type NavigationItem = { href: string; label: string; icon: string };

// Admin uses the existing manager permission in the API and database.
export const roleLabels: Record<Role, string> = {
  manager: "Admin",
  technician: "Kỹ thuật viên",
  customer: "Khách hàng",
};

export function roleHome(role: Role): string {
  return {
    manager: "/admin",
    technician: "/technician",
    customer: "/customer",
  }[role];
}
export function isTechnicianApplicant(
  user: Pick<Profile, "role" | "technician_status">,
): boolean {
  return (
    user.role === "customer" &&
    !!user.technician_status &&
    user.technician_status !== "approved"
  );
}
export function userHome(
  user: Pick<Profile, "role" | "technician_status">,
): string {
  return isTechnicianApplicant(user)
    ? "/staff-application"
    : roleHome(user.role);
}

export const roleNavigation: Record<Role, NavigationItem[]> = {
  manager: [
    { href: "/admin", label: "Tổng quan", icon: "overview" },
    { href: "/admin/appointments", label: "Lịch hẹn", icon: "appointments" },
    { href: "/admin/jobs", label: "Phiếu sửa chữa", icon: "jobs" },
    { href: "/admin/parts", label: "Linh kiện", icon: "parts" },
    {
      href: "/admin/technicians",
      label: "Duyệt kỹ thuật viên",
      icon: "technicians",
    },
  ],
  technician: [
    { href: "/technician", label: "Tổng quan công việc", icon: "overview" },
    { href: "/technician/jobs", label: "Công việc của tôi", icon: "jobs" },
  ],
  customer: [
    { href: "/customer", label: "Lịch hẹn của tôi", icon: "appointments" },
    { href: "/customer/booking", label: "Đặt lịch hẹn", icon: "booking" },
    { href: "/customer/track", label: "Theo dõi sửa chữa", icon: "track" },
    {
      href: "/customer/services",
      label: "Dịch vụ & chi phí",
      icon: "services",
    },
  ],
};

export function roleRedirect(
  pathname: string,
  role: Role,
  technicianStatus?: TechnicianStatus,
): string | null {
  const home = userHome({ role, technician_status: technicianStatus });
  if (["/profile", "/forgot-password", "/reset-password"].includes(pathname))
    return null;
  if (isTechnicianApplicant({ role, technician_status: technicianStatus }))
    return pathname === home ? null : home;
  if (pathname === "/staff-application")
    return role === "customer" ? null : home;
  if (
    ["/", "/login", "/staff/login", "/register", "/dashboard"].includes(
      pathname,
    )
  )
    return home;
  const aliases: Record<string, string> = {
    "/account": "/customer",
    "/booking": "/customer/booking",
    "/track": "/customer/track",
    "/services": "/customer/services",
  };
  if (aliases[pathname]) return role === "customer" ? aliases[pathname] : home;
  const area = ["/admin", "/technician", "/customer"].find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return area && area !== home ? home : null;
}
