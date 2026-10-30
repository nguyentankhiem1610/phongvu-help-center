"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  MapPin,
  Clock3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/views/components/app-provider";
import { services } from "@/views/presenters/catalog";
export default function Booking() {
  return (
    <Suspense
      fallback={<p className="container page-space">Đang tải biểu mẫu đặt lịch…</p>}
    >
      <BookingQuery />
    </Suspense>
  );
}
function BookingQuery() {
  const params = useSearchParams();
  const value = params.get("service");
  const service = services.find((item) => item.id === value)?.id || "cleaning";
  return <BookingForm key={service} initialService={service} />;
}
function BookingForm({ initialService }: { initialService: string }) {
  const { data, loading, act, notify } = useApp();
  const [service, setService] = useState(initialService);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("09:00");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [place, setPlace] = useState<"store" | "home">("store");
  const [address, setAddress] = useState(data.user?.address || "");
  const [{ today, max }] = useState(() => {
    const now = Date.now() + 7 * 3600000;
    return {
      today: new Date(now).toISOString().slice(0, 10),
      max: new Date(now + 90 * 86400000).toISOString().slice(0, 10),
    };
  });
  const slots = Array.from(
    { length: 24 },
    (_, i) =>
      `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const result = await act("book", {
        customer_name: form.get("customer_name"),
        customer_phone: form.get("customer_phone"),
        device_info: form.get("device_info"),
        issue_description: form.get("issue_description"),
        service,
        appointment_date: `${day}T${slot}`,
        service_location: place,
        service_address: place === "home" ? address : "",
        visit_notes: String(form.get("visit_notes") || ""),
      });
      setCode(String(result.code));
      notify("Đặt lịch thành công.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (code)
    return (
      <div className="container narrow page-space">
        <div className="panel success">
          <CheckCircle2 size={56} />
          <h1>Đặt lịch thành công!</h1>
          <p>Lịch hẹn đã được gửi đến quản lý để xác nhận.</p>
          <label>Mã lịch hẹn</label>
          <strong className="booking-code">{code}</strong>
          <p>Thông tin và tiến độ được lưu trong tài khoản của bạn.</p>
          <Link className="button" href="/account">
            Xem lịch hẹn <ArrowRight size={17} />
          </Link>
          <button className="text-button" onClick={() => setCode("")}>
            Đặt thêm lịch khác
          </button>
        </div>
      </div>
    );
  return (
    <div className="container page-space">
      <div className="breadcrumbs">
        <Link href="/">Trang chủ</Link>
        <ChevronRight size={12} />
        Đặt lịch hẹn
      </div>
      <div className="page-heading">
        <span className="overline">CHỦ ĐỘNG THỜI GIAN CỦA BẠN</span>
        <h1>Đặt lịch sửa chữa & bảo trì</h1>
        <p>
          Chọn mang máy đến cửa hàng hoặc yêu cầu kỹ thuật viên hỗ trợ tại nhà.
        </p>
      </div>
      <div className="booking-layout">
        <section className="panel booking-panel">
          <div className="step-line">
            <span className="step-number">1</span>
            <h2>Thông tin lịch hẹn</h2>
            <span className="soft-text">Các trường đều bắt buộc</span>
          </div>
          {loading ? (
            <p>Đang tải tài khoản…</p>
          ) : !data.user ? (
            <div className="empty compact">
              <UserPrompt />
              <h3>Đăng nhập để lưu lịch hẹn của bạn</h3>
              <p>Theo dõi tiến độ và xem báo giá an toàn trong tài khoản.</p>
              <Link className="button" href="/login">
                Đăng nhập để đặt lịch <ArrowRight size={16} />
              </Link>
            </div>
          ) : data.user.role !== "customer" ? (
            <div className="notice">
              Chức năng đặt lịch dành cho khách hàng.{" "}
              <Link href="/dashboard">Đến trang công việc</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              <div className="field-grid">
                <label>
                  Họ và tên
                  <input
                    name="customer_name"
                    autoComplete="name"
                    defaultValue={data.user.full_name}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    name="customer_phone"
                    type="tel"
                    autoComplete="tel"
                    pattern="0[0-9]{9}"
                    defaultValue={data.user.phone}
                    required
                  />
                </label>
              </div>
              <label>
                Thiết bị cần hỗ trợ
                <input
                  name="device_info"
                  placeholder="Ví dụ: ASUS Vivobook 15, Dell Inspiron 14…"
                  minLength={2}
                  maxLength={200}
                  required
                />
              </label>
              <label>
                Dịch vụ
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-grid">
                <label>
                  Hình thức phục vụ
                  <select
                    value={place}
                    onChange={(event) =>
                      setPlace(event.target.value as "store" | "home")
                    }
                  >
                    <option value="store">Tại cửa hàng</option>
                    <option value="home">Sửa máy tại nhà</option>
                  </select>
                </label>
              </div>
              {place === "home" && (
                <>
                  <label>
                    Địa chỉ sửa máy tại nhà
                    <textarea
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      rows={3}
                      minLength={10}
                      maxLength={500}
                      required
                      autoComplete="street-address"
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                    />
                  </label>
                  <label>
                    Ghi chú đến nhà
                    <textarea
                      name="visit_notes"
                      rows={2}
                      maxLength={1000}
                      placeholder="Số căn hộ, cổng vào, hướng dẫn liên hệ…"
                    />
                  </label>
                  <p className="notice">
                    Quản lý sẽ liên hệ xác nhận địa chỉ, khả năng phục vụ và chi
                    phí trước khi KTV đến.
                  </p>
                </>
              )}
              <div className="field-grid">
                <label>
                  {place === "home" ? "Ngày hẹn tại nhà" : "Ngày mang máy đến"}
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    min={today}
                    max={max}
                    required
                  />
                </label>
                <label>
                  Khung giờ · Việt Nam
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                  >
                    {slots.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Mô tả sự cố / Yêu cầu
                <textarea
                  name="issue_description"
                  rows={4}
                  required
                  minLength={5}
                  maxLength={2000}
                  placeholder="Máy có dấu hiệu gì? Bạn muốn kiểm tra hoặc nâng cấp bộ phận nào?"
                />
              </label>
              <p className="form-note">
                <ShieldCheck size={16} /> Lịch được quản lý xác nhận trước khi
                tiếp nhận. Chi phí cụ thể phụ thuộc kết quả kiểm tra.
              </p>
              <button className="button full" disabled={busy}>
                {busy ? "Đang gửi lịch hẹn…" : "Xác nhận đặt lịch"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </section>
        <aside className="booking-info">
          <div className="panel">
            <span className="overline">ĐIỂM TIẾP NHẬN</span>
            <h3>Phong Vũ Help Center</h3>
            <p>
              <MapPin size={18} />
              132E Cách Mạng Tháng Tám,
              <br />
              TP. Hồ Chí Minh
            </p>
            <p>
              <Clock3 size={18} />
              08:00 – 20:00 mỗi ngày
            </p>
            <div className="divider" />
            <strong>Trước khi mang máy đến</strong>
            <ul>
              <li>Sao lưu dữ liệu cá nhân quan trọng.</li>
              <li>Mang theo sạc và phụ kiện cần kiểm tra.</li>
              <li>Chuẩn bị mã lịch hẹn để tiếp nhận.</li>
            </ul>
          </div>
          <div className="tip">
            <CalendarDays size={27} />
            <h3>Lịch trình linh hoạt</h3>
            <p>
              Đặt lịch trong 90 ngày tới. Bạn có thể hủy lịch trước khi máy được
              tiếp nhận.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
function UserPrompt() {
  return <CalendarDays size={36} />;
}
