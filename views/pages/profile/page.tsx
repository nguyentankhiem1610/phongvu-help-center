"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/views/components/app-provider";

export default function ProfilePage() {
  const { data, act, notify } = useApp();
  const user = data.user;
  const legacyAuth = data.auth_provider === "supabase";
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  if (!user)
    return (
      <div className="container page-space panel">
        <Link href="/login">Đăng nhập để sửa hồ sơ</Link>
      </div>
    );
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setSaving(true);
    try {
      await act("profile", {
        full_name: form.get("full_name"),
        phone: form.get("phone"),
        address: form.get("address"),
      });
      notify("Đã cập nhật hồ sơ cá nhân.");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function password(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPasswordError("");
    setPasswordNotice("");
    if (form.get("password") !== form.get("confirmation")) {
      setPasswordError("Mật khẩu xác nhận chưa trùng khớp.");
      return;
    }
    setChanging(true);
    try {
      const result = await act("change_password", {
        current_password: form.get("current_password"),
        password: form.get("password"),
        nonce: String(form.get("nonce") || ""),
      });
      notify(String(result.message));
      router.replace(String(result.redirectTo));
      router.refresh();
    } catch (error) {
      setPasswordError((error as Error).message);
    } finally {
      setChanging(false);
    }
  }
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="overline">TÀI KHOẢN CỦA BẠN</span>
        <h1>Hồ sơ cá nhân</h1>
        <p>Cập nhật thông tin liên hệ, địa chỉ và mật khẩu đăng nhập.</p>
      </div>
      <div className="profile-layout">
        <section className="panel">
          <h2>Thông tin cá nhân</h2>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={save} key={user.id}>
            <label>
              Email
              <input
                value={user.email || ""}
                readOnly
                type="email"
                autoComplete="email"
              />
            </label>
            <label>
              Họ và tên
              <input
                name="full_name"
                defaultValue={user.full_name}
                minLength={2}
                maxLength={100}
                required
                autoComplete="name"
              />
            </label>
            <label>
              Số điện thoại
              <input
                name="phone"
                defaultValue={user.phone}
                pattern="0[0-9]{9}"
                type="tel"
                required
                autoComplete="tel"
              />
            </label>
            <label>
              Địa chỉ mặc định
              <textarea
                name="address"
                defaultValue={user.address || ""}
                maxLength={500}
                rows={3}
                autoComplete="street-address"
                placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
              />
            </label>
            <p className="soft-text">
              Địa chỉ này được gợi ý khi đặt lịch sửa máy tại nhà.
            </p>
            <button className="button" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu hồ sơ"}
            </button>
          </form>
        </section>
        <section className="panel">
          <h2>Đổi mật khẩu</h2>
          <p className="soft-text">
            Đổi mật khẩu thành công sẽ kết thúc các phiên đăng nhập.{" "}
            {legacyAuth
              ? "Tài khoản Google chưa có mật khẩu có thể dùng liên kết khôi phục qua email."
              : "Chỉ cần mật khẩu hiện tại, không cần email hay OTP."}
          </p>
          {passwordError && (
            <p className="error" role="alert">
              {passwordError}
            </p>
          )}
          {passwordNotice && (
            <p className="notice" role="status">
              {passwordNotice}
            </p>
          )}
          <form onSubmit={password}>
            <label>
              Mật khẩu hiện tại
              <input
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </label>
            <label>
              Xác nhận mật khẩu mới
              <input
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
              />
            </label>
            {legacyAuth && (
              <details>
                <summary>Xác nhận bổ sung nếu được yêu cầu</summary>
                <p className="soft-text">
                  Nếu phiên cũ cần mã xác nhận, nhận mã qua email và nhập bên
                  dưới. Nhân viên dùng email nội bộ có thể đăng xuất rồi đăng
                  nhập lại để làm mới phiên.
                </p>
                <button
                  type="button"
                  className="button secondary small"
                  disabled={changing}
                  onClick={async () => {
                    setChanging(true);
                    setPasswordError("");
                    try {
                      const r = await act("reauthenticate", {});
                      setPasswordNotice(String(r.message));
                    } catch (e) {
                      setPasswordError((e as Error).message);
                    } finally {
                      setChanging(false);
                    }
                  }}
                >
                  Nhận mã xác nhận
                </button>
                <label>
                  Mã xác nhận
                  <input
                    name="nonce"
                    autoComplete="one-time-code"
                    maxLength={128}
                  />
                </label>
              </details>
            )}
            <button className="button" disabled={changing}>
              {changing ? "Đang xử lý…" : "Đổi mật khẩu"}
            </button>
          </form>
          {legacyAuth && (
            <p>
              <Link href="/forgot-password">
                Quên mật khẩu / đặt mật khẩu qua email
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
