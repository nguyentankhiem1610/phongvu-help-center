import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile, Role } from "../../types/entities";
import { userHome } from "../navigation";

export function authError(error: unknown): Error {
  const value = error as { code?: string; message?: string };
  const messages: Record<string, string> = {
    invalid_credentials: "Email hoặc mật khẩu không đúng.",
    email_not_confirmed: "Tài khoản chưa được xác nhận trên Supabase. Quản lý cần kiểm tra Confirm email và trạng thái tài khoản trong Authentication → Users.",
    user_already_exists: "Email đã đăng ký. Hãy đăng nhập hoặc khôi phục mật khẩu.",
    weak_password: "Mật khẩu chưa đáp ứng yêu cầu của Supabase.",
    signup_disabled: "Project đang tắt đăng ký mới. Bật Allow new users to sign up trong Supabase → Authentication → Sign In / Providers.",
    email_provider_disabled: "Email provider đang tắt. Bật Enable Email provider trong Supabase → Authentication → Sign In / Providers → Email, giữ Confirm email tắt rồi lưu.",
    over_email_send_rate_limit: "Supabase đang giới hạn gửi email. Vui lòng thử lại sau.",
    email_address_invalid: "Supabase từ chối địa chỉ email này. Kiểm tra định dạng hoặc dùng địa chỉ email khác.",
    unexpected_failure: "Supabase không tạo được tài khoản. Kiểm tra Auth Logs và trigger tạo public.users.",
  };
  if (value.code && messages[value.code]) return new Error(messages[value.code]);
  if (/email signups are disabled/i.test(value.message || "")) {
    return new Error(messages.email_provider_disabled);
  }
  if (/fetch|network/i.test(value.message || "")) {
    return new Error("Không kết nối được Supabase. Kiểm tra Project URL và kết nối mạng.");
  }
  return new Error(value.message || "Không thể xử lý yêu cầu Supabase.");
}

export async function loadProfile(client: SupabaseClient, user: User): Promise<Profile> {
  const { data: row, error } = await client.from("users")
    .select("id,full_name,email,phone_number,address,role,is_active").eq("id", user.id).maybeSingle();
  if (error || !row) {
    throw new Error("Đã xác thực Supabase Auth nhưng chưa đọc được hồ sơ public.users. Kiểm tra setup.sql, trigger Auth và RLS trong project đang cấu hình.");
  }
  if (!row.is_active) throw new Error("Tài khoản đã bị vô hiệu hóa. Liên hệ quản lý.");
  const roles: Record<string, Role> = { Customer: "customer", Technician: "technician", Manager: "manager" };
  if (!roles[row.role]) throw new Error("Role trong public.users không hợp lệ.");
  // Ho tro tai khoan tao voi phien ban trigger cu chua luu so dien thoai.
  const metadataPhone = user.user_metadata?.phone;
  if (!row.phone_number && typeof metadataPhone === "string" && /^0\d{9}$/.test(metadataPhone)) {
    const saved = await client.from("users").update({ phone_number: metadataPhone }).eq("id", user.id);
    if (saved.error) throw authError(saved.error);
    row.phone_number = metadataPhone;
  }
  return {
    id: row.id, full_name: row.full_name, email: row.email, phone: row.phone_number || "",
    address: row.address || "", role: roles[row.role],
  };
}

export async function performAuthAction(
  client: SupabaseClient, action: string, input: Record<string, unknown>, origin: string,
): Promise<Record<string, unknown>> {
  const email = String(input.email || input.username || "").trim().toLowerCase();
  const password = String(input.password || "");
  if (action === "register") {
    const fullName = String(input.full_name || "").trim();
    const phone = String(input.phone || "").trim();
    if (fullName.length < 2 || fullName.length > 100 || !/^0\d{9}$/.test(phone) || password.length < 8) {
      throw new Error("Kiểm tra họ tên, số điện thoại 10 chữ số và mật khẩu tối thiểu 8 ký tự.");
    }
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) throw authError(error);
    if (!data.session) {
      throw new Error("Supabase chưa cấp phiên đăng nhập. Tắt Confirm email trong Authentication → Sign In / Providers → Email, lưu thiết lập rồi thử lại.");
    }
    const profile = await loadProfile(client, data.session.user);
    return { ok: true, verification: false, redirectTo: userHome(profile) };
  }
  if (action === "login" || action === "staff_login") {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw authError(error);
    let profile: Profile;
    try {
      profile = await loadProfile(client, data.user);
      if (action === "staff_login" && profile.role === "customer") {
        throw new Error("Tài khoản chưa được cấp quyền Admin hoặc kỹ thuật viên. Hãy đăng nhập tại trang khách hàng.");
      }
    } catch (error) {
      await client.auth.signOut({ scope: "local" });
      throw error;
    }
    return { ok: true, redirectTo: userHome(profile) };
  }
  if (action === "logout") {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw authError(error);
    return { ok: true };
  }
  if (action === "forgot_password") {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` });
    if (error) throw authError(error);
    return { ok: true, message: "Nếu email đã đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu." };
  }
  if (action === "reset_password" || action === "change_password") {
    if (password.length < 8) throw new Error("Mật khẩu mới cần tối thiểu 8 ký tự.");
    const { error } = await client.auth.updateUser({
      password,
      ...(action === "change_password" ? { current_password: String(input.current_password || "") } : {}),
      ...(input.nonce ? { nonce: String(input.nonce) } : {}),
    });
    if (error) throw authError(error);
    // Doi mat khau thanh cong thi ket thuc cac phien theo thong bao tren giao dien.
    const signedOut = await client.auth.signOut({ scope: "global" });
    if (signedOut.error) throw new Error("Mật khẩu đã đổi nhưng chưa đăng xuất được các phiên. Vui lòng đăng xuất và đăng nhập lại.");
    return { ok: true, message: "Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.", redirectTo: "/login" };
  }
  if (action === "reauthenticate") {
    const { error } = await client.auth.reauthenticate();
    if (error) throw authError(error);
    return { ok: true, message: "Kiểm tra email để lấy mã xác nhận." };
  }
  if (action === "profile") {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) throw new Error("Vui lòng đăng nhập để cập nhật hồ sơ.");
    const saved = await client.from("users").update({
      full_name: String(input.full_name || "").trim(), phone_number: String(input.phone || "").trim(),
      address: String(input.address || "").trim(),
    }).eq("id", data.user.id);
    if (saved.error) throw authError(saved.error);
    return { ok: true };
  }
  throw new Error("Chức năng này chưa kết nối thao tác lưu với Supabase. Tài khoản và đăng nhập đã dùng Supabase Auth.");
}
