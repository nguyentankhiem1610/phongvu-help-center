import type { TechnicianStatus } from "@/types/entities";
export const technicianStatusLabels: Record<TechnicianStatus, string> = {
  draft: "Chưa gửi hồ sơ",
  pending: "Chờ Admin duyệt",
  approved: "Đã duyệt",
  rejected: "Cần bổ sung hồ sơ",
};

export const appointmentLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  processing: "Đã tiếp nhận",
  completed: "Hoàn tất",
};

export { ticketLabels } from "@/views/presenters/status";
export const services = [
  {
    id: "cleaning",
    name: "Vệ sinh & bảo dưỡng",
    description: "Làm sạch linh kiện, thay keo tản nhiệt, kiểm tra tổng thể.",
    price: 150000,
    icon: "fan",
  },
  {
    id: "repair",
    name: "Kiểm tra & sửa chữa",
    description: "Chẩn đoán lỗi nguồn, màn hình, bàn phím và phần cứng.",
    price: 0,
    icon: "wrench",
  },
  {
    id: "upgrade",
    name: "Nâng cấp RAM & SSD",
    description: "Tư vấn cấu hình, nâng cấp hiệu năng phù hợp với máy.",
    price: 250000,
    icon: "cpu",
  },
  {
    id: "software",
    name: "Cài đặt phần mềm",
    description: "Cài đặt hệ điều hành và phần mềm có bản quyền của bạn.",
    price: 100000,
    icon: "shield",
  },
];

export const STORE = {
  name: "Phong Vũ Help Center · Điểm tiếp nhận demo",
  address: "132E Cách Mạng Tháng Tám, TP. Hồ Chí Minh",
  hours: "08:00 – 20:00 mỗi ngày",
};
