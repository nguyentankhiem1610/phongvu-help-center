"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useApp } from "@/views/components/app-provider";
import { userHome } from "@/views/navigation";

export function LoginScreen({
  staff = false,
  legacyAuth = false,
}: {
  staff?: boolean;
  legacyAuth?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="container page-space">
          <p>Đang tải…</p>
        </div>
      }
    >
      <LoginForm staff={staff} legacyAuth={legacyAuth} />
    </Suspense>
  );
}

function LoginForm({
  staff,
  legacyAuth,
}: {
  staff: boolean;
  legacyAuth: boolean;
}) {
  const { data, act, notify } = useApp();
  const searchParams = useSearchParams();
  const isRegisterParam =
    !staff &&
    (searchParams.get("mode") === "register" ||
      searchParams.get("register") === "true");
  const [register, setRegister] = useState(isRegisterParam);
  const [confirmation, setConfirmation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const authErrors: Record<string, string> = {
    disabled:
      "Đăng nhập Google và xác nhận email đang tắt. Hãy dùng email và mật khẩu của ứng dụng.",
    google:
      "Chưa kết nối được Google. Bản giao diện chưa kết nối đăng nhập Google.",
    callback:
      "Liên kết đăng nhập/xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập hoặc đăng ký lại.",
    profile:
      "Đã xác thực nhưng chưa đọc được hồ sơ. Hãy chọn lại vai trò ở thanh xem giao diện.",
    staff:
      "Tài khoản nhân viên đăng nhập bằng tên tài khoản và mật khẩu được cấp.",
  };
  const [error, setError] = useState(
    authErrors[searchParams.get("auth_error") || ""] || "",
  );
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setConfirmation("");
    const form = new FormData(e.currentTarget);
    try {
      const r = await act(
        staff ? "staff_login" : register ? "register" : "login",
        {
          ...(staff ? { username: email } : { email }),
          password,
          ...(register
            ? {
                full_name: form.get("full_name"),
                phone: form.get("phone"),
                account_type: "customer",
              }
            : {}),
        },
      );
      if (r.verification) {
        setConfirmation(
          `Đã tạo tài khoản cho ${email}. Mở email xác nhận (kiểm tra cả thư rác), rồi đăng nhập để bắt đầu đặt lịch.`,
        );
        notify(
          "Đăng ký thành công. Kiểm tra email để xác nhận, sau đó quay lại đăng nhập.",
        );
        setRegister(false);
      } else {
        notify(
          register ? "Tạo tài khoản thành công." : "Đăng nhập thành công.",
        );
        router.replace(
          typeof r.redirectTo === "string" ? r.redirectTo : "/customer",
        );
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container login-page">
      <div className="login-story">
        <span className="overline">
          {staff ? "KHÔNG GIAN NHÂN VIÊN" : "MỘT TÀI KHOẢN, TRỌN HÀNH TRÌNH"}
        </span>
        <h1>
          {staff ? "Tập trung công việc." : "Chăm sóc laptop."}
          <br />
          <em>Dễ dàng hơn mỗi ngày.</em>
        </h1>
        <p>
          {staff
            ? "Admin điều phối dịch vụ, kỹ thuật viên xử lý công việc được giao. Dùng tài khoản do chủ hệ thống cấp."
            : legacyAuth
              ? "Đăng ký bằng email, xác nhận tài khoản và theo dõi quá trình chăm sóc thiết bị của bạn."
              : "Tạo tài khoản bằng email và mật khẩu để theo dõi quá trình chăm sóc thiết bị của bạn."}
        </p>
        <Image src="/laptop-care.svg" alt="Laptop được chăm sóc" width={700} height={480} style={{ height: "auto" }} />
        <div>
          <ShieldCheck size={20} /> Thông tin lịch hẹn chỉ hiển thị theo quyền
          truy cập.
        </div>
      </div>
      <section className="panel login-panel">
        <span className="overline">CHÀO MỪNG BẠN</span>
        <p className="notice">
          Bản xem giao diện: biểu mẫu chỉ mở vai trò mẫu, không tạo hoặc xác
          thực tài khoản.
        </p>
        {!staff && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              margin: "16px 0 10px",
              background: "#f0f3fa",
              padding: "4px",
              borderRadius: "8px",
            }}
          >
            <button
              type="button"
              style={{
                flex: 1,
                padding: "9px 12px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                background: !register ? "#ffffff" : "transparent",
                color: !register ? "var(--blue)" : "var(--muted)",
                boxShadow: !register ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setRegister(false);
                setError("");
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: "9px 12px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                background: register ? "#ffffff" : "transparent",
                color: register ? "var(--blue)" : "var(--muted)",
                boxShadow: register ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.2s ease",
              }}
              onClick={() => {
                setRegister(true);
                setError("");
              }}
            >
              Đăng ký tài khoản
            </button>
          </div>
        )}
        <h2>
          {staff
            ? "Đăng nhập nhân viên"
            : register
              ? "Tạo tài khoản khách hàng"
              : "Đăng nhập khách hàng"}
        </h2>
        <p className="soft-text">
          {staff
            ? "Dùng tên đăng nhập và mật khẩu được cấp. Không cần email xác nhận."
            : register
              ? legacyAuth
                ? "Nhập thông tin và xác nhận email để bắt đầu đặt lịch."
                : "Có thể dùng email mẫu đúng định dạng. Không cần xác nhận email hay OTP."
              : "Tiếp tục hành trình chăm sóc thiết bị của bạn."}
        </p>
        {data.user && (
          <div className="notice">
            Bạn đã đăng nhập với {data.user.email}.{" "}
            <Link href={userHome(data.user)}>Đến không gian của bạn</Link>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {confirmation && (
          <div className="notice" role="status">
            {confirmation}
          </div>
        )}
        {!staff && legacyAuth && (
          <>
            <a
              className="button secondary full google-login"
              href="/auth/google"
            >
              <span aria-hidden="true" className="google-letter">
                G
              </span>{" "}
              Tiếp tục với Google
            </a>
            <div className="auth-divider">hoặc dùng email</div>
          </>
        )}
        <form onSubmit={submit}>
          {register && (
            <>
              <label>
                Họ và tên
                <input
                  name="full_name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </label>
              <label>
                Số điện thoại
                <input
                  name="phone"
                  type="tel"
                  pattern="0[0-9]{9}"
                  required
                  autoComplete="tel"
                  placeholder="0901234567"
                />
              </label>
            </>
          )}
          <label>
            {staff ? "Tên đăng nhập" : "Email"}
            <input
              type={staff ? "text" : "email"}
              required
              autoComplete={staff ? "username" : "email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                staff
                  ? "admin@gmail.com, technical01 hoặc technical02"
                  : "email@example.com"
              }
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              required
              minLength={8}
              autoComplete={register ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
            />
          </label>
          <button className="button full" disabled={busy}>
            {busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập"}
            <ArrowRight size={17} />
          </button>
        </form>
        {!register && (
          <p className="switch-auth">
            {legacyAuth ? (
              <Link href="/forgot-password">Quên mật khẩu?</Link>
            ) : (
              "Quên mật khẩu? Liên hệ chủ hệ thống để đặt lại."
            )}
          </p>
        )}
        {!staff && (
          <p className="switch-auth">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Đăng nhập ngay" : "Tạo tài khoản mới"}
            </button>
          </p>
        )}
        <p className="switch-auth">
          <Link href={staff ? "/login" : "/staff/login"}>
            {staff
              ? "Đăng nhập / đăng ký khách hàng"
              : "Đăng nhập dành cho Admin & kỹ thuật viên"}
          </Link>
        </p>
      </section>
    </div>
  );
}
