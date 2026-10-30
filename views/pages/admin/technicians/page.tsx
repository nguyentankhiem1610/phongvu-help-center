"use client";
import { useState } from "react";
import { CheckCircle2, RefreshCw, Users, XCircle } from "lucide-react";
import { useApp } from "@/views/components/app-provider";
import { dateTime } from "@/views/presenters/format";
import { technicianStatusLabels } from "@/views/presenters/catalog";
import { type TechnicianStatus } from "@/types/entities";

export default function TechnicianApprovalsPage() {
  const { data, act, notify, refresh, error: connectionError } = useApp();
  const [status, setStatus] = useState<TechnicianStatus | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const applications = (data.technician_applications || []).filter(
    (a) => a.status !== "draft" && (status === "all" || a.status === status),
  );
  async function review(userId: string, decision: "approved" | "rejected") {
    setError("");
    if (decision === "rejected" && (notes[userId] || "").trim().length < 5) {
      setError("Nhập lý do từ chối/bổ sung ít nhất 5 ký tự trước khi gửi.");
      return;
    }
    setBusy(userId);
    try {
      await act("review_technician", {
        user_id: userId,
        decision,
        review_note: notes[userId] || "",
      });
      notify(
        decision === "approved"
          ? "Đã cấp quyền kỹ thuật viên cho tài khoản."
          : "Đã gửi yêu cầu bổ sung hồ sơ.",
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div>
      <div className="workspace-heading">
        <div>
          <span className="overline">ADMIN · NHÂN SỰ KỸ THUẬT</span>
          <h1>Duyệt kỹ thuật viên</h1>
          <p>Xem hồ sơ và cấp quyền nhận công việc cho nhân viên đã đăng ký.</p>
        </div>
        <button
          className="button secondary small"
          onClick={() => void refresh()}
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>
      {(error || connectionError) && (
        <div className="error" role="alert">
          {error || connectionError}
        </div>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>Hồ sơ đăng ký</h2>
          <label className="application-status-filter">
            Trạng thái
            <select
              aria-label="Lọc hồ sơ kỹ thuật viên"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TechnicianStatus | "all")
              }
            >
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Cần bổ sung</option>
              <option value="all">Tất cả đã gửi</option>
            </select>
          </label>
        </div>
        <div className="application-list">
          {applications.map((application) => (
            <article className="application-card" key={application.user_id}>
              <div className="section-heading">
                <div>
                  <h3>{application.full_name}</h3>
                  <p>{application.email || application.phone}</p>
                </div>
                <span
                  className={`badge badge-${application.status === "approved" ? "delivered" : application.status === "rejected" ? "cancelled" : "pending"}`}
                >
                  {technicianStatusLabels[application.status]}
                </span>
              </div>
              <dl>
                <div>
                  <dt>Điện thoại</dt>
                  <dd>{application.phone}</dd>
                </div>
                <div>
                  <dt>Chuyên môn</dt>
                  <dd>{application.specialization || "—"}</dd>
                </div>
                <div>
                  <dt>Kinh nghiệm</dt>
                  <dd>{application.experience_years} năm</dd>
                </div>
                <div>
                  <dt>Ngày gửi</dt>
                  <dd>
                    {application.submitted_at
                      ? dateTime(application.submitted_at)
                      : "Nhân viên đã có trước đây"}
                  </dd>
                </div>
              </dl>
              <p className="preserve">{application.introduction}</p>
              {application.status === "pending" ? (
                <div className="application-review">
                  <label>
                    Ghi chú / lý do yêu cầu bổ sung
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={notes[application.user_id] || ""}
                      onChange={(e) =>
                        setNotes({
                          ...notes,
                          [application.user_id]: e.target.value,
                        })
                      }
                      placeholder="Bắt buộc nêu lý do nếu không chấp nhận hồ sơ"
                    />
                  </label>
                  <div className="button-row">
                    <button
                      className="button"
                      disabled={!!busy}
                      onClick={() =>
                        void review(application.user_id, "approved")
                      }
                    >
                      <CheckCircle2 size={16} />
                      {busy === application.user_id
                        ? "Đang xử lý…"
                        : "Chấp nhận & cấp quyền"}
                    </button>
                    <button
                      className="button secondary danger"
                      disabled={!!busy}
                      onClick={() =>
                        void review(application.user_id, "rejected")
                      }
                    >
                      <XCircle size={16} />
                      Yêu cầu bổ sung / Từ chối
                    </button>
                  </div>
                </div>
              ) : (
                <p className="application-review-result">
                  {application.reviewed_at && (
                    <>Đã xử lý: {dateTime(application.reviewed_at)}. </>
                  )}
                  {application.review_note}
                </p>
              )}
            </article>
          ))}
        </div>
        {!applications.length && (
          <div className="empty compact">
            <Users size={36} />
            <h3>Không có hồ sơ phù hợp</h3>
            <p>
              Hồ sơ mới sẽ hiển thị sau khi kỹ thuật viên hoàn tất thông tin và
              gửi duyệt.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
