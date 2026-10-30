"use client";
import { useState } from "react";
import Link from "next/link";
import { useApp } from "./app-provider";

export function PasswordRecovery({
  reset = false,
}: {
  reset?: boolean;
}) {
  const { data, act, loading } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  if (data.auth_provider !== "supabase")
    return (
      <div className="container narrow page-space">
        <section className="panel">
          <h1>Khôi phục mật khẩu</h1>
          <p>
            Cần cấu hình kết nối Supabase để gửi email khôi phục và đặt lại mật khẩu.
          </p>
          <Link href="/login">Quay lại đăng nhập</Link>
        </section>
      </div>
    );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setMessage("");
    if (reset && form.get("password") !== form.get("confirmation")) {
      setError("Mật khẩu xác nhận chưa trùng khớp.");
      return;
    }
    setBusy(true);
    try {
      const result = await act(
        reset ? "reset_password" : "forgot_password",
        reset
          ? { password: form.get("password") }
          : { email: form.get("email") },
      );
      setMessage(String(result.message));
      if (reset) setDone(true);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container narrow page-space">
      <section className="panel">
        <h1>{reset ? "Đặt mật khẩu mới" : "Quên mật khẩu"}</h1>
        <p>
          {reset
            ? "Nhập mật khẩu mới cho tài khoản đã yêu cầu khôi phục."
            : "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu."}
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {done ? (
          <Link className="button" href="/login">
            Đăng nhập với mật khẩu mới
          </Link>
        ) : reset && !data.user ? (
          <p role="alert">
            {loading ? "Đang xác nhận liên kết khôi phục…" : "Liên kết khôi phục không hợp lệ hoặc đã hết hạn."}{" "}
            <Link href="/forgot-password">Yêu cầu liên kết mới</Link>.
          </p>
        ) : (
          <form onSubmit={submit}>
            {reset ? (
              <>
                <label>
                  Mật khẩu mới
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
                <label>
                  Xác nhận mật khẩu mới
                  <input
                    type="password"
                    name="confirmation"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
              </>
            ) : (
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  required
                />
              </label>
            )}
            <button className="button" disabled={busy}>
              {busy
                ? "Đang xử lý…"
                : reset
                  ? "Lưu mật khẩu mới"
                  : "Gửi liên kết khôi phục"}
            </button>
          </form>
        )}
        <p>
          <Link href="/login">Quay lại đăng nhập khách hàng</Link> ·{" "}
          <Link href="/staff/login">Đăng nhập nhân viên</Link>
        </p>
      </section>
    </div>
  );
}
