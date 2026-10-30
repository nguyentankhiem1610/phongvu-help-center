# Phong Vũ Help Center

Giao diện từ `phongvu-frontend-2026-10-30.zip` được tích hợp vào dự án Next.js hiện tại, sử dụng React, TypeScript, CSS và ảnh/logo/font cục bộ.

## Chạy dự án

```sh
npm ci
npm run dev
```

Mở http://localhost:3000. Không cần cấu hình `.env` hay tài khoản thật. Thanh chọn vai trò ở cuối màn hình cho phép xem giao diện công khai, khách hàng, Admin, kỹ thuật viên và hồ sơ kỹ thuật viên.

## Các màn hình

- Trang chủ, danh sách dịch vụ, đăng nhập/đăng ký và khôi phục mật khẩu.
- Khách hàng: đặt lịch, lịch hẹn, theo dõi sửa chữa và hồ sơ cá nhân.
- Admin: tổng quan, lịch hẹn, phiếu sửa chữa, linh kiện và duyệt kỹ thuật viên.
- Kỹ thuật viên: tổng quan công việc, việc được giao, chi tiết thiết bị, nhật ký và báo giá.

Đây là bản frontend dùng dữ liệu mẫu. Đăng nhập chỉ chuyển vai trò xem thử; các thao tác nghiệp vụ chưa lưu dữ liệu và chưa kết nối backend. Việc chọn vai trò không phải cơ chế xác thực hay phân quyền bảo mật.

## Cấu trúc

```text
app/                 Route, layout và CSS
views/pages/         Các màn hình
views/components/    Thành phần giao diện và provider dữ liệu mẫu
views/presenters/    Nhãn và định dạng
views/preview/       Dữ liệu mẫu
views/api/           Adapter để tích hợp backend sau
 types/              Kiểu dữ liệu
public/              Ảnh, SVG, font và giấy phép font
```

Để kết nối backend, thay phần dữ liệu và hành động trong `views/components/app-provider.tsx` và adapter `views/api/service-client.ts`.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm run build
```

Dự án học phần mô phỏng, không phải website chính thức của Phong Vũ.
