"use client";
import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Wrench,
  Search,
  ChevronRight,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Plus,
  X,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useApp } from "@/views/components/app-provider";
import { useDialog } from "@/views/components/use-dialog";
import { TicketDetail, Badge } from "@/views/components/ticket-detail";
import { dateTime, money } from "@/views/presenters/format";
import { type Appointment, type Part } from "@/types/entities";
import { appointmentLabels, ticketLabels } from "@/views/presenters/catalog";
import type { WorkspaceSection } from "@/views/navigation";
export function StaffWorkspace({
  section: tab = "overview",
}: {
  section?: WorkspaceSection;
}) {
  const { data, loading, error, refresh, act, notify } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [part, setPart] = useState<Partial<Part> | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const partDialogRef = useDialog(() => setPart(null), !!part);
  const manager = data.user?.role === "manager";
  const allowed = manager || data.user?.role === "technician";
  const scopedTickets = data.tickets.filter(
    (t) => manager || t.technician_id === data.user?.id,
  );
  const relevant = data.appointments.filter((a) => {
    const day = new Date(new Date(a.appointment_date).getTime() + 7 * 3600000)
      .toISOString()
      .slice(0, 10);
    return (
      (manager || scopedTickets.some((t) => t.appointment_id === a.id)) &&
      (!from || day >= from) &&
      (!to || day <= to)
    );
  });
  const appointments = relevant
    .filter((a) => {
      const t = data.tickets.find((t) => t.appointment_id === a.id);
      return (
        ((manager && tab !== "jobs") || !!t) &&
        (filter === "all" ||
          (tab === "jobs" || !manager ? t?.status : a.status) === filter) &&
        `${a.code} ${t?.code || ""} ${a.customer_name} ${a.customer_phone} ${a.device_info} ${a.service_address || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      );
    })
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
  const tickets = scopedTickets.filter((t) =>
    relevant.some((a) => a.id === t.appointment_id),
  );
  const delivered = tickets.filter((t) => t.status === "delivered");
  const statuses =
    tab === "jobs" || !manager ? ticketLabels : appointmentLabels;
  const labels: Record<string, string> = {
    overview: manager ? "Tổng quan dịch vụ" : "Tổng quan công việc",
    appointments: "Quản lý lịch hẹn",
    jobs: manager ? "Phiếu sửa chữa" : "Công việc được giao",
    parts: "Danh mục linh kiện",
  };
  async function savePart(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    const f = new FormData(e.currentTarget);
    try {
      await act("part", {
        ...(part?.id ? { id: part.id } : {}),
        name: f.get("name"),
        category: f.get("category"),
        price: Number(f.get("price")),
        warranty_period: f.get("warranty_period"),
        is_available: f.get("is_available") === "on",
      });
      notify("Đã lưu danh mục linh kiện.");
      setPart(null);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="container page-space panel empty">
        Đang tải khu vực làm việc…
      </div>
    );
  if (!allowed)
    return (
      <div className="container page-space panel empty">
        <Wrench size={40} />
        <h1>Khu vực nhân viên</h1>
        <p>Đăng nhập bằng tài khoản quản lý hoặc kỹ thuật viên để tiếp tục.</p>
        <Link className="button" href="/staff/login">
          Đăng nhập
        </Link>
      </div>
    );
  return (
    <div className="staff-workspace">
      <section className="workspace-content">
        <div className="workspace-heading">
          <div>
            <div className="breadcrumbs">
              {manager ? "Admin" : "Kỹ thuật viên"}
              <ChevronRight size={12} />
              {labels[tab]}
            </div>
            <h1>{labels[tab]}</h1>
            <p>
              {manager
                ? "Theo dõi lịch hẹn và điều phối dịch vụ tại cửa hàng."
                : "Tiếp nhận công việc được giao, ghi nhận báo giá và cập nhật xử lý."}
            </p>
          </div>
          <button
            className="button secondary small"
            onClick={() => void refresh()}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {tab !== "parts" && (
          <div className="date-filter">
            <Filter size={16} />
            <span>Lọc theo ngày hẹn</span>
            <label>
              Từ
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Đến
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            {(from || to) && (
              <button
                className="text-button"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
              >
                Xóa lọc
              </button>
            )}
          </div>
        )}
        {tab === "overview" && (
          <>
            <div className="stat-grid">
              <Stat
                icon={CalendarDays}
                name={manager ? "Tổng lịch hẹn" : "Tổng công việc"}
                value={manager ? relevant.length : tickets.length}
                note="Trong khoảng ngày hẹn đã chọn"
                color="blue"
              />
              <Stat
                icon={Clock3}
                name={manager ? "Chờ xác nhận" : "Chờ kiểm tra"}
                value={
                  manager
                    ? relevant.filter((a) => a.status === "pending").length
                    : tickets.filter((t) => t.status === "received").length
                }
                note={
                  manager
                    ? "Cần quản lý xác nhận"
                    : "Công việc được giao chưa bắt đầu"
                }
                color="amber"
              />
              <Stat
                icon={Wrench}
                name={manager ? "Đang sửa chữa" : "Đang xử lý"}
                value={
                  tickets.filter(
                    (t) =>
                      t.status === "repairing" || t.status === "diagnosing",
                  ).length
                }
                note="Đang kiểm tra hoặc sửa máy"
                color="purple"
              />
              <Stat
                icon={CheckCircle2}
                name={manager ? "Đã bàn giao" : "Chờ bàn giao"}
                value={
                  manager
                    ? delivered.length
                    : tickets.filter((t) => t.status === "completed").length
                }
                note={
                  manager
                    ? "Đã hoàn tất dịch vụ"
                    : "Đã sửa xong, chờ Admin bàn giao"
                }
                color="green"
              />
            </div>
            <div className="overview-grid">
              <section className="panel">
                <div className="section-heading">
                  <h3>
                    {manager
                      ? "Trạng thái lịch hẹn"
                      : "Tiến độ công việc của tôi"}
                  </h3>
                  <span className="soft-text">
                    {manager ? relevant.length : tickets.length}{" "}
                    {manager ? "lịch" : "việc"}
                  </span>
                </div>
                <div className="status-bars">
                  {Object.entries(
                    manager ? appointmentLabels : ticketLabels,
                  ).map(([key, label]) => {
                    const count = (manager ? relevant : tickets).filter(
                      (a) => a.status === key,
                    ).length;
                    return (
                      <div key={key}>
                        <label>{label}</label>
                        <div>
                          <span
                            className={`bar-${key}`}
                            style={{
                              width: `${(manager ? relevant.length : tickets.length) ? (count / (manager ? relevant.length : tickets.length)) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </section>
              {manager ? (
                <section className="panel total-panel">
                  <span className="overline">GIÁ TRỊ BÁO GIÁ ĐÃ BÀN GIAO</span>
                  <h2>
                    {money(
                      delivered.reduce((sum, t) => sum + t.total_price, 0),
                    )}
                  </h2>
                  <p>
                    Tổng báo giá của {delivered.length} phiếu đã bàn giao, theo
                    ngày lịch hẹn. Không phải doanh thu thanh toán thực tế.
                  </p>
                  <div className="divider" />
                  <strong>
                    {tickets.filter((t) => !t.technician_id).length} phiếu chưa
                    phân công
                  </strong>
                  <Link className="text-button" href="/admin/jobs">
                    Xem phiếu sửa chữa <ArrowUpRight size={15} />
                  </Link>
                </section>
              ) : (
                <section className="panel technician-focus">
                  <span className="overline">CẦN XỬ LÝ</span>
                  <h2>
                    {tickets.filter((t) => t.status === "received").length} việc
                    chưa bắt đầu
                  </h2>
                  <p>
                    Mở công việc được giao để kiểm tra thiết bị, lập báo giá và
                    cập nhật tiến độ cho khách hàng.
                  </p>
                  <Link className="button small" href="/technician/jobs">
                    Xem công việc của tôi <ArrowUpRight size={15} />
                  </Link>
                </section>
              )}
            </div>
            {manager && (
              <section className="panel workload">
                <h3>Phân bổ kỹ thuật viên</h3>
                <div>
                  {data.profiles
                    .filter((p) => p.role === "technician")
                    .map((p) => (
                      <div key={p.id}>
                        <span className="avatar">
                          {p.full_name.split(" ").at(-1)?.slice(0, 1)}
                        </span>
                        <strong>
                          {p.full_name}
                          <small>
                            {
                              tickets.filter(
                                (t) =>
                                  t.technician_id === p.id &&
                                  !["delivered", "completed"].includes(
                                    t.status,
                                  ),
                              ).length
                            }{" "}
                            việc đang xử lý
                          </small>
                        </strong>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </>
        )}
        {tab !== "parts" && (
          <section className="panel appointments-panel">
            <div className="section-heading">
              <h3>
                {tab === "overview"
                  ? manager
                    ? "Lịch hẹn gần nhất"
                    : "Công việc gần nhất"
                  : tab === "jobs"
                    ? "Danh sách công việc"
                    : "Danh sách lịch hẹn"}
              </h3>
              <span className="soft-text">{appointments.length} kết quả</span>
            </div>
            <div className="filters">
              <div className="search-field">
                <Search size={17} />
                <input
                  aria-label="Tìm trong danh sách công việc"
                  placeholder="Tìm mã lịch, khách hàng, thiết bị…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                aria-label="Lọc trạng thái công việc"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(statuses).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Khách hàng / Thiết bị</th>
                    <th>Thời gian hẹn</th>
                    <th>Trạng thái</th>
                    {manager && <th>Kỹ thuật viên</th>}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {(tab === "overview"
                    ? appointments.slice(0, 6)
                    : appointments
                  ).map((a) => {
                    const t = data.tickets.find(
                      (t) => t.appointment_id === a.id,
                    );
                    return (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.customer_name}</strong>
                          <span className="table-sub">{a.device_info}</span>
                          {a.service_location === "home" && (
                            <span className="table-sub">
                              Sửa tại nhà · {a.service_address}
                            </span>
                          )}
                          <span className="table-code">
                            {tab === "jobs" || !manager ? t?.code : a.code}
                          </span>
                        </td>
                        <td>
                          {dateTime(a.appointment_date)}
                          <span className="table-sub">{a.customer_phone}</span>
                        </td>
                        <td>
                          <Badge
                            kind={
                              tab === "jobs" || !manager
                                ? "ticket"
                                : "appointment"
                            }
                            status={
                              tab === "jobs" || !manager
                                ? t?.status || a.status
                                : a.status
                            }
                          />
                        </td>
                        {manager && (
                          <td>
                            {t?.technician_id ? (
                              data.profiles.find(
                                (p) => p.id === t.technician_id,
                              )?.full_name || "Bạn"
                            ) : (
                              <span className="soft-text">Chưa phân công</span>
                            )}
                          </td>
                        )}
                        <td>
                          <button
                            className="text-button nowrap"
                            onClick={() => setSelected(a)}
                          >
                            Chi tiết <ChevronRight size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!appointments.length && (
                <div className="empty compact">
                  <Search size={30} />
                  <h3>Không có kết quả phù hợp</h3>
                  <p>Thử thay đổi bộ lọc hoặc khoảng ngày hẹn.</p>
                </div>
              )}
            </div>
          </section>
        )}
        {tab === "parts" && manager && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h3>Danh mục linh kiện</h3>
                <p className="soft-text">
                  Phục vụ tra cứu và lập báo giá, không quản lý nhập xuất tồn.
                </p>
              </div>
              <button
                className="button small"
                onClick={() => {
                  setPart({ is_available: true });
                  setFormError("");
                }}
              >
                <Plus size={16} />
                Thêm linh kiện
              </button>
            </div>
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Tìm linh kiện"
                placeholder="Tìm tên hoặc nhóm linh kiện…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Linh kiện</th>
                    <th>Giá tham khảo</th>
                    <th>Bảo hành</th>
                    <th>Khả dụng</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.parts
                    .filter((p) =>
                      `${p.name} ${p.category}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.name}</strong>
                          <span className="table-sub">{p.category}</span>
                        </td>
                        <td>{money(p.price)}</td>
                        <td>{p.warranty_period}</td>
                        <td>
                          <span
                            className={`badge ${p.is_available ? "badge-delivered" : "badge-cancelled"}`}
                          >
                            {p.is_available ? "Khả dụng" : "Tạm ngừng"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() => {
                              setPart(p);
                              setFormError("");
                            }}
                          >
                            Chỉnh sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
      {selected && (
        <TicketDetail
          appointment={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {part && (
        <div className="modal-backdrop">
          <section
            ref={partDialogRef}
            className="modal part-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="part-title"
          >
            <div className="modal-head">
              <h2 id="part-title">
                {part.id ? "Chỉnh sửa linh kiện" : "Thêm linh kiện"}
              </h2>
              <button aria-label="Đóng linh kiện" onClick={() => setPart(null)}>
                <X />
              </button>
            </div>
            <form className="modal-body" onSubmit={savePart}>
              {formError && (
                <div className="error" role="alert">
                  {formError}
                </div>
              )}
              <label>
                Tên linh kiện
                <input
                  name="name"
                  defaultValue={part.name}
                  minLength={2}
                  maxLength={150}
                  required
                />
              </label>
              <label>
                Nhóm linh kiện
                <input
                  name="category"
                  defaultValue={part.category}
                  maxLength={80}
                  required
                />
              </label>
              <div className="field-grid">
                <label>
                  Đơn giá (VNĐ)
                  <input
                    type="number"
                    name="price"
                    defaultValue={part.price ?? 0}
                    min={0}
                    max={100000000}
                    required
                  />
                </label>
                <label>
                  Bảo hành
                  <input
                    name="warranty_period"
                    defaultValue={part.warranty_period}
                    maxLength={100}
                    required
                  />
                </label>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_available"
                  defaultChecked={part.is_available}
                />
                Cho phép dùng trong báo giá
              </label>
              <button className="button full" disabled={busy}>
                {busy ? "Đang lưu…" : "Lưu linh kiện"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function Stat({
  icon: Icon,
  name,
  value,
  note,
  color,
}: {
  icon: typeof CalendarDays;
  name: string;
  value: number;
  note: string;
  color: string;
}) {
  return (
    <section className="stat">
      <div>
        <span>{name}</span>
        <span className={`stat-icon ${color}`}>
          <Icon size={21} />
        </span>
      </div>
      <strong>{value.toString().padStart(2, "0")}</strong>
      <p>{note}</p>
    </section>
  );
}
