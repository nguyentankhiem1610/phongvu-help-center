import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/views/components/shell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Phong Vũ Help Center | Chăm sóc laptop của bạn",
  description:
    "Đặt lịch sửa chữa, theo dõi tiến độ và quản lý dịch vụ bảo trì laptop. Đồ án Nhóm 05.",
  icons: { icon: "/phongvu-logo.svg" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Shell>{children}</Shell>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
