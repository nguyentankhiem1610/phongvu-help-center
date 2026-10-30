"use client";
import { useState } from "react";
import { useDialog } from "./use-dialog";
import { X, Plus, Trash2 } from "lucide-react";
import { useApp } from "./app-provider";
import { appointmentLabels, ticketLabels } from "@/views/presenters/catalog";
import { money, dateTime } from "@/views/presenters/format";
import { type Appointment, type QuoteItem } from "@/types/entities";
export function Badge({
  status,
  kind = "ticket",
}: {
  status: string;
  kind?: "appointment" | "ticket";
}) {
  return (
    <span className={`badge badge-${status}`}>
      {(kind === "appointment"
        ? appointmentLabels[status]
        : ticketLabels[status]) || status}
    </span>
  );
}
export function TicketDetail({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const { data, act, notify } = useApp();
  const dialogRef = useDialog(onClose);
  const a =
    data.appointments.find((x) => x.id === appointment.id) || appointment;
  const t = data.tickets.find((x) => x.appointment_id === a.id);
  const manager = data.user?.role === "manager";
  const staff = manager || data.user?.role === "technician";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>(
    t?.quote_items.length
      ? t.quote_items
      : [
          {
            part_id: null,
            item_name: "Công sửa chữa",
            quantity: 1,
            unit_price: 150000,
          },
        ],
  );
  const [editing, setEditing] = useState(false);
  async function run(action: string, payload: unknown) {
    setBusy(true);
    setError("");
    try {
      await act(action, payload);
      notify("Đã lưu thay đổi.");
      if (action === "quote") setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const events = data.events
    .filter((e) => e.appointment_id === a.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const next: Record<string, string> = {
    received: "diagnosing",
    diagnosing: "repairing",
    repairing: "completed",
    completed: "delivered",
  };
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="modal-head">
          <div>
            <span className="overline">CHI TIẾT DỊCH VỤ</span>
            <h2 id="detail-title">{a.device_info}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng chi tiết">
            <X />
          </button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <div className="detail-summary">
            <Badge
              status={t?.status || a.status}
              kind={t ? "ticket" : "appointment"}
            />
            <span>
              Mã lịch: <code>{a.code}</code>
            </span>
            {t && (
              <span>
                Mã phiếu: <code>{t.code}</code>
              </span>
            )}
          </div>
          <div className="detail-grid">
            <div>
              <label>Khách hàng</label>
              <strong>{a.customer_name}</strong>
              <p>{a.customer_phone}</p>
            </div>
            <div>
              <label>Thời gian hẹn</label>
              <strong>{dateTime(a.appointment_date)}</strong>
              <p>Giờ Việt Nam · GMT+7</p>
            </div>
            <div className="span-2">
              <label>Hình thức phục vụ</label>
              <strong>
                {a.service_location === "home"
                  ? "Sửa máy tại nhà"
                  : "Tại cửa hàng"}
              </strong>
              {a.service_location === "home" && (
                <p className="preserve">{a.service_address}</p>
              )}
              {a.visit_notes && (
                <p className="preserve">Ghi chú đến nhà: {a.visit_notes}</p>
              )}
            </div>
            <div className="span-2">
              <label>Mô tả yêu cầu</label>
              <p className="preserve">{a.issue_description}</p>
            </div>
            {t && (
              <>
                <div>
                  <label>Serial thiết bị</label>
                  <p>{t.serial_number}</p>
                </div>
                <div>
                  <label>Kỹ thuật viên</label>
                  <p>
                    {data.profiles.find((p) => p.id === t.technician_id)
                      ?.full_name ||
                      (t.technician_id ? "Đã phân công" : "Chưa phân công")}
                  </p>
                </div>
                <div className="span-2">
                  <label>Ghi nhận tiếp nhận</label>
                  <p className="preserve">{t.intake_notes}</p>
                </div>
              </>
            )}
          </div>
          {manager && a.status === "pending" && (
            <button
              className="button"
              disabled={busy}
              onClick={() => run("confirm", { id: a.id })}
            >
              Xác nhận lịch hẹn
            </button>
          )}
          {["pending", "confirmed"].includes(a.status) &&
            (manager || data.user?.id === a.customer_id) && (
              <button
                className="button secondary danger"
                disabled={busy}
                onClick={() => run("cancel", { id: a.id })}
              >
                Hủy lịch hẹn
              </button>
            )}
          {manager && a.status === "confirmed" && !t && (
            <form
              className="subform"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run("receive", {
                  id: a.id,
                  serial_number: f.get("serial_number"),
                  intake_notes: f.get("intake_notes"),
                });
              }}
            >
              <h3>Tiếp nhận thiết bị</h3>
              <label>
                Serial / mã nhận diện máy
                <input
                  name="serial_number"
                  maxLength={100}
                  required
                  placeholder="Serial hoặc mã nhận diện được ghi trên máy"
                />
              </label>
              <label>
                Tình trạng máy & phụ kiện nhận kèm
                <textarea
                  name="intake_notes"
                  minLength={5}
                  maxLength={2000}
                  required
                  rows={3}
                  placeholder="Ngoại hình, tình trạng ban đầu, sạc và phụ kiện…"
                />
              </label>
              <button className="button" disabled={busy}>
                Lập phiếu tiếp nhận
              </button>
            </form>
          )}
          {t && manager && !["completed", "delivered"].includes(t.status) && (
            <form
              className="subform inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run("assign", {
                  id: t.id,
                  technician_id: f.get("technician_id"),
                });
              }}
            >
              <label>
                Phân công kỹ thuật viên
                <select
                  name="technician_id"
                  required
                  defaultValue={t.technician_id || ""}
                >
                  <option value="" disabled>
                    Chọn kỹ thuật viên
                  </option>
                  {data.profiles
                    .filter((p) => p.role === "technician")
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                </select>
              </label>
              <button className="button secondary" disabled={busy}>
                Lưu phân công
              </button>
            </form>
          )}
          {t &&
            staff &&
            t.status !== "delivered" &&
            (manager || t.status !== "completed") && (
              <form
                className="subform"
                key={t.status}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run("progress", {
                    id: t.id,
                    status: next[t.status],
                    notes: f.get("notes"),
                  });
                }}
              >
                <h3>Cập nhật tiến độ</h3>
                <p className="soft-text">
                  Bước tiếp theo:{" "}
                  <strong>{ticketLabels[next[t.status]]}</strong>
                </p>
                <label>
                  Nội dung cập nhật cho khách hàng
                  <textarea
                    name="notes"
                    minLength={3}
                    maxLength={2000}
                    required
                    rows={3}
                    placeholder="Ghi rõ kết quả kiểm tra hoặc công việc đã thực hiện…"
                  />
                </label>
                <button className="button" disabled={busy || !t.technician_id}>
                  Lưu trạng thái
                </button>
                {!t.technician_id && (
                  <p className="soft-text">
                    Cần phân công kỹ thuật viên trước khi cập nhật.
                  </p>
                )}
              </form>
            )}
          {t && (
            <section className="subform">
              <div className="section-heading">
                <h3>Báo giá dịch vụ</h3>
                {staff && !["completed", "delivered"].includes(t.status) && (
                  <button
                    className="text-button"
                    onClick={() => {
                      setEditing(!editing);
                      setItems(
                        t.quote_items.length
                          ? t.quote_items
                          : [
                              {
                                part_id: null,
                                item_name: "Công sửa chữa",
                                quantity: 1,
                                unit_price: 150000,
                              },
                            ],
                      );
                    }}
                  >
                    {editing ? "Đóng chỉnh sửa" : "Lập / sửa báo giá"}
                  </button>
                )}
              </div>
              {editing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run("quote", { id: t.id, items });
                  }}
                >
                  <p className="soft-text">
                    Giá linh kiện được lấy từ danh mục khi lưu. Tiền công nhập
                    riêng.
                  </p>
                  {items.map((item, i) => (
                    <div className="quote-edit" key={i}>
                      <select
                        aria-label={`Loại hạng mục ${i + 1}`}
                        value={item.part_id || ""}
                        onChange={(e) => {
                          const part = data.parts.find(
                            (p) => p.id === e.target.value,
                          );
                          setItems(
                            items.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    part_id: part?.id || null,
                                    item_name: part?.name || "Công sửa chữa",
                                    unit_price: part?.price || 0,
                                  }
                                : x,
                            ),
                          );
                        }}
                      >
                        <option value="">Dịch vụ / tiền công</option>
                        {data.parts
                          .filter((p) => p.is_available)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <input
                        aria-label={`Tên hạng mục ${i + 1}`}
                        value={item.item_name}
                        required
                        minLength={2}
                        maxLength={150}
                        readOnly={!!item.part_id}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === i ? { ...x, item_name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={`Số lượng ${i + 1}`}
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === i
                                ? { ...x, quantity: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={`Đơn giá ${i + 1}`}
                        type="number"
                        min={0}
                        max={100000000}
                        required
                        readOnly={!!item.part_id}
                        value={item.unit_price}
                        onChange={(e) =>
                          setItems(
                            items.map((x, j) =>
                              j === i
                                ? { ...x, unit_price: Number(e.target.value) }
                                : x,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Xóa hạng mục ${i + 1}`}
                        onClick={() =>
                          setItems(items.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <div className="button-row">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={items.length >= 30}
                      onClick={() =>
                        setItems([
                          ...items,
                          {
                            part_id: null,
                            item_name: "",
                            quantity: 1,
                            unit_price: 0,
                          },
                        ])
                      }
                    >
                      <Plus size={15} />
                      Thêm hạng mục
                    </button>
                    <button
                      className="button"
                      disabled={busy || items.length === 0}
                    >
                      Lưu báo giá
                    </button>
                  </div>
                </form>
              ) : t.quote_items.length ? (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Hạng mục</th>
                          <th>SL</th>
                          <th>Đơn giá</th>
                          <th>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.quote_items.map((i, index) => (
                          <tr key={index}>
                            <td>{i.item_name}</td>
                            <td>{i.quantity}</td>
                            <td>{money(i.unit_price)}</td>
                            <td>{money(i.unit_price * i.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="quote-total">
                    <span>Tổng báo giá</span>
                    <strong>{money(t.total_price)}</strong>
                  </div>
                  <p className="price-note">
                    Báo giá tham khảo của bản demo. Thanh toán trực tuyến ngoài
                    phạm vi.
                  </p>
                </>
              ) : (
                <p className="soft-text">
                  Chưa có báo giá. Kỹ thuật viên sẽ cập nhật sau khi kiểm tra
                  máy.
                </p>
              )}
            </section>
          )}
          <section className="subform">
            <h3>Lịch sử xử lý</h3>
            <ol className="timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <span />
                  <div>
                    <strong>{e.message}</strong>
                    <small>
                      {dateTime(e.created_at)} · {e.actor_name}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
            <p className="price-note">
              Dữ liệu tự cập nhật mỗi 15 giây khi trang đang mở.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
