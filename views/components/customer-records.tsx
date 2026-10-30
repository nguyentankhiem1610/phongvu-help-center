"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  CalendarDays,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useApp } from "./app-provider";
import { TicketDetail, Badge } from "./ticket-detail";
import { dateTime } from "@/views/presenters/format";
import { services } from "@/views/presenters/catalog";
import { type Appointment } from "@/types/entities";
export function CustomerRecords({ track = false }: { track?: boolean }) {
  const { data, loading, error, refresh } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const records = data.appointments
    .filter((a) => a.customer_id === data.user?.id)
    .filter(
      (a) =>
        `${a.code} ${a.device_info}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (status === "all" || a.status === status),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <div className="container page-space">
      <div className="breadcrumbs">
        <Link href="/customer">Khách hàng</Link>
        <ChevronRight size={12} />
        {track ? "Tra cứu tiến độ" : "Lịch hẹn của tôi"}
      </div>
      <div className="page-heading between">
        <div>
          <span className="overline">ĐỒNG HÀNH CÙNG THIẾT BỊ</span>
          <h1>{track ? "Theo dõi tiến độ sửa chữa" : "Lịch hẹn của bạn"}</h1>
          <p>
            {track
              ? "Xem trạng thái, lịch sử xử lý và báo giá của từng thiết bị."
              : `Xin chào${data.user ? ", " + data.user.full_name : ""}. Đây là các lịch hẹn thuộc tài khoản của bạn.`}
          </p>
        </div>
        <Link className="button" href="/customer/booking">
          Đặt lịch mới <ArrowRight size={16} />
        </Link>
      </div>
      {error && (
        <div className="error">
          {error}
          <button onClick={() => void refresh()}>Thử lại</button>
        </div>
      )}
      {loading ? (
        <div className="panel empty">Đang tải lịch hẹn…</div>
      ) : !data.user ? (
        <div className="panel empty">
          <CalendarDays size={42} />
          <h2>Đăng nhập để xem lịch hẹn</h2>
          <p>
            Lịch hẹn và phiếu sửa chữa chỉ hiển thị trong tài khoản có quyền
            truy cập.
          </p>
          <Link className="button" href="/login">
            Đăng nhập <ArrowRight size={16} />
          </Link>
        </div>
      ) : data.user.role !== "customer" ? (
        <div className="panel empty">
          <h2>Khu vực làm việc của bạn</h2>
          <p>Tài khoản này phụ trách quản lý hoặc kỹ thuật.</p>
          <Link className="button" href="/dashboard">
            Đến trang công việc
          </Link>
        </div>
      ) : (
        <section className="panel">
          <div className="filters">
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="Tìm lịch hẹn"
                placeholder="Tìm mã lịch hẹn hoặc tên thiết bị…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Lọc trạng thái"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <button
              className="icon-button"
              aria-label="Làm mới dữ liệu"
              onClick={() => void refresh()}
            >
              <RefreshCw size={17} />
            </button>
          </div>
          <div className="record-list">
            {records.map((a) => {
              const ticket = data.tickets.find(
                (t) => t.appointment_id === a.id,
              );
              return (
                <button
                  className="record"
                  key={a.id}
                  onClick={() => setSelected(a)}
                >
                  <div className="device-icon">
                    <CalendarDays size={24} />
                  </div>
                  <div className="record-main">
                    <span className="record-code">{a.code}</span>
                    <h3>{a.device_info}</h3>
                    <p>
                      {services.find((s) => s.id === a.service)?.name} ·{" "}
                      {dateTime(a.appointment_date)}
                      {a.service_location === "home" && " · Sửa tại nhà"}
                    </p>
                  </div>
                  <Badge
                    status={ticket?.status || a.status}
                    kind={ticket ? "ticket" : "appointment"}
                  />
                  <ChevronRight size={18} />
                </button>
              );
            })}
            {!records.length && (
              <div className="empty compact">
                <Search size={32} />
                <h3>Chưa có lịch hẹn phù hợp</h3>
                <p>Thử thay đổi bộ lọc hoặc đặt lịch mới.</p>
              </div>
            )}
          </div>
        </section>
      )}
      {selected && (
        <TicketDetail
          appointment={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
