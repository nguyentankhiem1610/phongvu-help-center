"use client";
import { useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, Send, UserRound } from "lucide-react";
import { useApp } from "@/views/components/app-provider";
import { dateTime } from "@/views/presenters/format";
import { technicianStatusLabels } from "@/views/presenters/catalog";

export default function StaffApplicationPage() {
  const { data, act, notify, refresh, error: connectionError } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const application = data.technician_applications?.find(
    (a) => a.user_id === data.user?.id,
  );
  const pending = application?.status === "pending";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await act("apply_technician", {
        full_name: form.get("full_name"),
        phone: form.get("phone"),
        specialization: form.get("specialization"),
        experience_years: Number(form.get("experience_years")),
        introduction: form.get("introduction"),
      });
      notify(
        "Đã gửi hồ sơ đến Admin. Bạn sẽ được cấp quyền sau khi được duyệt.",
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="application-page">
      <div className="workspace-heading">
        <div>
          <span className="overline">ĐĂNG KÝ KỸ THUẬT VIÊN</span>
          <h1>
            {pending
              ? "Hồ sơ đang chờ Admin duyệt"
              : "Hoàn tất hồ sơ kỹ thuật viên"}
          </h1>
          <p>
            {pending
              ? "Hồ sơ đã được gửi. Quyền truy cập công việc sẽ được mở sau khi Admin chấp nhận."
              : "Bổ sung thông tin chuyên môn để Admin xem xét và cấp quyền nhận công việc."}
          </p>
        </div>
        <button
          className="button secondary small"
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} />
          Kiểm tra trạng thái
        </button>
      </div>
      <ol
        className="application-steps"
        aria-label="Các bước đăng ký kỹ thuật viên"
      >
        <li className="done">
          <CheckCircle2 size={19} />
          Tạo tài khoản
        </li>
        <li className={pending ? "done" : "current"}>
          <UserRound size={19} />
          Bổ sung & gửi hồ sơ
        </li>
        <li className={pending ? "current" : ""}>
          <Clock3 size={19} />
          Admin phê duyệt
        </li>
      </ol>
      {(error || connectionError) && (
        <div className="error" role="alert">
          {error || connectionError}
        </div>
      )}
      {application?.status === "rejected" && (
        <div className="notice application-feedback">
          <strong>Admin yêu cầu bổ sung hồ sơ</strong>
          <p className="preserve">{application.review_note}</p>
          <p>Bạn có thể chỉnh sửa và gửi lại bên dưới.</p>
        </div>
      )}
      {pending ? (
        <section className="panel application-summary">
          <span className="badge badge-pending">
            {technicianStatusLabels.pending}
          </span>
          <h2>{application.full_name}</h2>
          <dl>
            <div>
              <dt>Email đăng nhập</dt>
              <dd>{data.user?.email}</dd>
            </div>
            <div>
              <dt>Số điện thoại</dt>
              <dd>{application.phone}</dd>
            </div>
            <div>
              <dt>Chuyên môn</dt>
              <dd>{application.specialization}</dd>
            </div>
            <div>
              <dt>Kinh nghiệm</dt>
              <dd>{application.experience_years} năm</dd>
            </div>
            <div>
              <dt>Đã gửi lúc</dt>
              <dd>
                {application.submitted_at
                  ? dateTime(application.submitted_at)
                  : "—"}
              </dd>
            </div>
          </dl>
          <h3>Giới thiệu</h3>
          <p className="preserve">{application.introduction}</p>
          <p className="application-help">
            Trang tự kiểm tra trạng thái mỗi 15 giây. Khi được chấp nhận, bạn sẽ
            được chuyển tới trang công việc của kỹ thuật viên.
          </p>
        </section>
      ) : (
        <form className="panel application-form" onSubmit={submit}>
          <h2>Thông tin cá nhân & chuyên môn</h2>
          <p className="soft-text">Email đăng nhập: {data.user?.email}</p>
          <div className="field-grid">
            <label>
              Họ và tên
              <input
                name="full_name"
                defaultValue={application?.full_name || data.user?.full_name}
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />
            </label>
            <label>
              Số điện thoại
              <input
                name="phone"
                type="tel"
                defaultValue={application?.phone || data.user?.phone}
                autoComplete="tel"
                pattern="0[0-9]{9}"
                placeholder="0901234567"
                required
              />
            </label>
          </div>
          <div className="field-grid">
            <label>
              Chuyên môn
              <input
                name="specialization"
                defaultValue={application?.specialization}
                minLength={2}
                maxLength={150}
                placeholder="Ví dụ: sửa laptop, phần cứng, nâng cấp RAM/SSD"
                required
              />
            </label>
            <label>
              Số năm kinh nghiệm
              <input
                name="experience_years"
                type="number"
                defaultValue={application?.experience_years ?? 0}
                min={0}
                max={60}
                step={1}
                required
              />
            </label>
          </div>
          <label>
            Giới thiệu & kinh nghiệm làm việc
            <textarea
              name="introduction"
              rows={5}
              defaultValue={application?.introduction}
              minLength={20}
              maxLength={2000}
              placeholder="Mô tả kinh nghiệm, kỹ năng và những loại thiết bị bạn đã xử lý (ít nhất 20 ký tự)…"
              required
            />
          </label>
          <p className="form-note">
            Admin sẽ xem các thông tin này trước khi cấp quyền kỹ thuật viên.
          </p>
          <button className="button" disabled={busy}>
            <Send size={16} />
            {busy
              ? "Đang gửi…"
              : application?.status === "rejected"
                ? "Gửi lại hồ sơ"
                : "Gửi hồ sơ đến Admin"}
          </button>
        </form>
      )}
    </div>
  );
}
