# Phong Vũ Help Center


## Chạy dự án

```sh
npm ci
npm run dev
```

Mở http://localhost:3000. Khi chưa cấu hình Supabase, thanh chọn vai trò ở cuối màn hình cho phép xem giao diện với dữ liệu mẫu; đăng ký/đăng nhập sẽ báo cần cấu hình thay vì giả lập thành công.

## Cấu hình môi trường

File [.env.example](.env.example) chứa cấu hình kết nối Supabase. Nếu chưa có `.env.local`, sao chép file mẫu thành `.env.local` ở thư mục gốc:

```powershell
Copy-Item .env.example .env.local
```

Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` lấy từ **Connect** trong Supabase Dashboard, theo [hướng dẫn API keys](https://supabase.com/docs/guides/getting-started/api-keys). Khởi động lại `npm run dev` sau khi thay cấu hình.

`.env.example` được lưu trên Git; `.env.local` được bỏ qua. Thay cả hai giá trị mẫu bằng thông tin thật. Cấu hình thiếu/sai hoặc còn `your-project`/`your_key` sẽ hiển thị lỗi, không tạo tài khoản mẫu.

Trong **Authentication → Sign In / Providers**, cấu hình:

- **Allow new users to sign up: ON** — cho phép tạo tài khoản mới.
- Trong **Email**, đặt **Enable Email provider: ON** — cho phép dùng email/mật khẩu.
- **Confirm email: OFF** — bỏ bước xác nhận thư, rồi lưu.

Hai mục Email provider và Confirm email có chức năng khác nhau: tắt Email provider sẽ gây lỗi `Email signups are disabled`, không phải chỉ bỏ xác nhận thư. Trước khi đăng ký, ứng dụng kiểm tra cả ba thiết lập và báo đúng mục cần chỉnh trước khi gọi `signUp`. Xem [cấu hình Auth của Supabase](https://supabase.com/docs/guides/auth/general-configuration).

Trong **Authentication → URL Configuration**, đặt Site URL đúng địa chỉ ứng dụng và thêm `http://localhost:3000/reset-password` vào Redirect URLs nếu dùng chức năng quên mật khẩu. Khi deploy, thêm URL tương ứng của website.

## Đăng ký và đăng nhập Supabase

Khi có biến môi trường Supabase, ứng dụng gọi `supabase.auth.signUp`, đăng nhập bằng email/mật khẩu, khôi phục phiên, đăng xuất, khôi phục/đổi mật khẩu và cập nhật hồ sơ thật. Thanh chọn vai trò mẫu được tắt; quyền được đọc từ `public.users`.

1. Chạy `supabase/setup.sql` trên database mới theo hướng dẫn bên dưới. Nếu đã chạy, không chạy lại script khởi tạo.
2. Điền cấu hình thật trong `.env.local`, khởi động lại dev server.
3. Đăng ký bằng email đúng định dạng và mật khẩu. Tài khoản được tạo ở **Authentication → Users**; trigger trong `setup.sql` tạo hồ sơ tương ứng ở **Table Editor → public.users**.
4. Khi **Confirm email** tắt, ứng dụng nhận phiên và đăng nhập ngay sau khi tạo tài khoản; không có bước mở thư hay nhập OTP. Thiết lập này nằm ở project, không phải một biến `.env`. Xem [Supabase password Auth](https://supabase.com/docs/guides/auth/passwords).
5. Cấp Manager/Technician qua SQL Editor theo `supabase/README.md`, không cho người đăng ký tự chọn quyền.

Tài khoản đã “tạo” ở phiên bản xem giao diện trước đây không được lưu và không có mật khẩu thật; cần đăng ký lại sau khi kết nối. Nếu Supabase báo lỗi trigger tạo user, xem Auth Logs và kiểm tra schema đã được khởi tạo đúng project.

## Các màn hình

- Trang chủ, danh sách dịch vụ, đăng nhập/đăng ký và khôi phục mật khẩu.
- Khách hàng: đặt lịch, lịch hẹn, theo dõi sửa chữa và hồ sơ cá nhân.
- Admin: tổng quan, lịch hẹn, phiếu sửa chữa, linh kiện và duyệt kỹ thuật viên.
- Kỹ thuật viên: tổng quan công việc, việc được giao, chi tiết thiết bị, nhật ký và báo giá.

Đã kết nối các chức năng tài khoản và đọc lịch hẹn, phiếu, báo giá, linh kiện, nhật ký theo RLS. Các nút ghi nghiệp vụ như đặt lịch, tiếp nhận, phân công, lưu báo giá và duyệt KTV chưa nối tới RPC; chúng báo rõ chưa kết nối và không báo lưu thành công. Khi chưa cấu hình Supabase, chế độ xem giao diện vẫn dùng dữ liệu mẫu.

## Cấu trúc

```text
app/                 Route, layout và CSS
views/pages/         Các màn hình
views/components/    Thành phần giao diện, provider Supabase và provider xem mẫu
views/presenters/    Nhãn và định dạng
views/preview/       Dữ liệu mẫu
views/api/           Supabase client, Auth và adapter đọc dữ liệu
types/               Kiểu dữ liệu
public/              Ảnh, SVG, font và giấy phép font
```

Luồng xác thực nằm trong `views/api/auth-actions.ts`, ánh xạ dữ liệu đọc trong `views/api/supabase-snapshot.ts`, trạng thái phiên trong `views/components/supabase-provider.tsx`. Có thể nối thêm các RPC nghiệp vụ đã có trong SQL ở bước tiếp theo.

## Database Supabase

Bộ khởi tạo database mới và dữ liệu mẫu nằm trong [supabase/setup.sql](supabase/setup.sql). Xem [hướng dẫn database](supabase/README.md) để chạy SQL, cấp quyền và liên kết dữ liệu mẫu với tài khoản thật.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm run test:auth
npm run build
```

Dự án học phần mô phỏng, không phải website chính thức của Phong Vũ.
