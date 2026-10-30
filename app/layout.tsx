import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/views/components/shell";
import { Toaster } from "sonner";
import { Suspense } from "react";

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
        <Suspense
          fallback={
            <main className="container page-space panel empty" role="status">
              Đang tải không gian của bạn…
            </main>
          }
        >
          <Shell>{children}</Shell>
        </Suspense>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
