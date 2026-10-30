"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Phone,
  UserRound,
  CalendarDays,
  ArrowUpRight,
  ShieldCheck,
  Headphones,
  Menu,
  X,
  Wrench,
} from "lucide-react";
import { AppProvider, useApp } from "./app-provider";
import { RoleWorkspace } from "./role-workspace";
import { roleRedirect } from "@/views/navigation";
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Frame>{children}</Frame>
    </AppProvider>
  );
}
function Frame({ children }: { children: React.ReactNode }) {
  const { data, loading, error, refresh } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState(false);
  const destination = data.user
    ? roleRedirect(pathname, data.user.role, data.user.technician_status)
    : null;
  useEffect(() => {
    if (!loading && destination) {
      // Preserve service selections from links on the public website.
      const query =
        pathname === "/booking" || pathname === "/services"
          ? window.location.search
          : "";
      router.replace(`${destination}${query}`);
    }
  }, [loading, destination, pathname, router]);
  if (loading || destination)
    return (
      <main
        id="main"
        className="container page-space panel empty"
        role="status"
      >
        Đang tải không gian của bạn…
      </main>
    );
  if (error && !data.user)
    return (
      <main id="main" className="container page-space panel empty">
        <p role="alert">{error}</p>
        <button className="button" onClick={() => void refresh()}>
          Thử lại
        </button>
      </main>
    );
  if (data.user) return <RoleWorkspace>{children}</RoleWorkspace>;
  const links = [
    ["/", "Trang chủ"],
    ["/services", "Dịch vụ sửa chữa"],
    ["/booking", "Đặt lịch hẹn"],
    ["/track", "Tra cứu tiến độ"],
  ];
  return (
    <>
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      <div className="announcement">
        <span>PHONG VŨ HELP CENTER</span> Chăm sóc laptop, an tâm mỗi ngày{" "}
        <Link href="/booking">
          Đặt lịch ngay <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="utility">
        <div className="container">
          <span>
            <MapPin size={13} /> Một điểm tiếp nhận · TP. Hồ Chí Minh
          </span>
          <div>
            <a href="https://phongvu.vn/" target="_blank" rel="noreferrer">
              Trang mua sắm Phong Vũ <ArrowUpRight size={12} />
            </a>
            <span>
              <Headphones size={13} /> Hỗ trợ dịch vụ
            </span>
          </div>
        </div>
      </div>
      <header>
        <div className="container header-inner">
          <Link className="brand" href="/" aria-label="Phong Vũ Help Center">
            <img src="/phongvu-logo.svg" alt="PHONG VŨ" />
            <span>HELP CENTER</span>
          </Link>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/services?q=${encodeURIComponent(search)}`);
            }}
          >
            <input
              aria-label="Tìm dịch vụ"
              placeholder="Bạn cần hỗ trợ gì cho laptop hôm nay?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button aria-label="Tìm kiếm">
              <Search size={20} />
            </button>
          </form>
          <Link href="/account" className="header-action">
            <CalendarDays size={25} />
            <span>
              Lịch hẹn<span className="sub">của bạn</span>
            </span>
          </Link>
          <Link href="/login" className="header-action">
            <UserRound size={25} />
            <span>
              Đăng nhập
              <span className="sub">Tài khoản của bạn</span>
            </span>
          </Link>
          <button
            className="mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Mở menu"
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <nav className={menu ? "nav open" : "nav"}>
        <div className="container">
          <div className="nav-links">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "active" : ""}
                onClick={() => setMenu(false)}
              >
                {label}
              </Link>
            ))}
          </div>
          <span className="nav-note">
            <ShieldCheck size={15} /> Chăm sóc tận tâm · Thông tin minh bạch
          </span>
        </div>
      </nav>
      <main id="main">{children}</main>
      <footer>
        <div className="container footer-grid">
          <div>
            <Link className="footer-title" href="/">
              PHONG VŨ <span>HELP CENTER</span>
            </Link>
            <p>
              Đồng hành cùng thiết bị của bạn.
              <br />
              Đặt lịch thuận tiện, theo dõi dễ dàng.
            </p>
            <div className="demo-label">Đồ án Nhóm 05 · Phiên bản mô phỏng</div>
          </div>
          <div>
            <h4>Dịch vụ khách hàng</h4>
            <Link href="/booking">Đặt lịch sửa chữa</Link>
            <Link href="/track">Theo dõi tiến độ</Link>
            <Link href="/services">Dịch vụ & chi phí tham khảo</Link>
          </div>
          <div>
            <h4>Điểm tiếp nhận demo</h4>
            <p>
              132E Cách Mạng Tháng Tám
              <br />
              TP. Hồ Chí Minh
            </p>
            <p>08:00 – 20:00 mỗi ngày</p>
          </div>
          <div>
            <h4>Luôn sẵn sàng hỗ trợ</h4>
            <p>
              <Wrench size={16} /> Kiểm tra · Sửa chữa · Bảo trì
            </p>
            <p>Mọi chi phí được ghi nhận trong báo giá trước khi bàn giao.</p>
          </div>
        </div>
        <div className="container footer-bottom">
          Dự án học phần Quản lý Dự án CNTT · Không phải website vận hành chính
          thức của Phong Vũ.<span>Bản giao diện frontend</span>
        </div>
      </footer>
    </>
  );
}
