import type { Database } from "@/types/entities";

export function seedDatabase(): Database {
  const created = new Date().toISOString();
  const day = (offset: number, hour: number) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    d.setUTCHours(hour - 7, 0, 0, 0);
    return d.toISOString();
  };
  const profiles: Database["profiles"] = [
    {
      id: "demo-customer",
      full_name: "Nguyễn Minh Anh",
      phone: "0901234567",
      email: "khach@demo.vn",
      role: "customer",
    },
    {
      id: "demo-manager",
      full_name: "Quản lý cửa hàng",
      phone: "0900000001",
      email: "quanly@demo.vn",
      role: "manager",
    },
    {
      id: "demo-tech",
      full_name: "Trần Hoàng Nam",
      phone: "0900000002",
      email: "kythuat@demo.vn",
      role: "technician",
    },
    {
      id: "demo-tech-2",
      full_name: "Lê Gia Bảo",
      phone: "0900000003",
      email: "kythuat2@demo.vn",
      role: "technician",
    },
    {
      id: "demo-customer-2",
      full_name: "Lê Ngọc Linh",
      phone: "0907654321",
      email: "khach2@demo.vn",
      role: "customer",
    },
  ];
  const details = [
    ["ASUS Vivobook 15", "Máy nóng và quạt kêu lớn", "cleaning", "pending"],
    [
      "Dell Inspiron 14",
      "Nâng cấp ổ cứng để làm việc",
      "upgrade",
      "processing",
    ],
    ["MacBook Air M1", "Vệ sinh máy định kỳ", "cleaning", "confirmed"],
    ["Lenovo ThinkPad E14", "Máy khởi động chậm", "repair", "processing"],
    ["HP Pavilion 15", "Cài đặt lại hệ điều hành", "software", "completed"],
    ["Acer Aspire 7", "Bàn phím bị liệt vài phím", "repair", "pending"],
  ];
  const appointments = details.map((v, i) => ({
    id: `demo-appointment-${i + 1}`,
    code: `PV-DEMO000${i + 1}`,
    customer_id: i === 5 ? "demo-customer-2" : "demo-customer",
    customer_name: i === 5 ? "Lê Ngọc Linh" : "Nguyễn Minh Anh",
    customer_phone: i === 5 ? "0907654321" : "0901234567",
    device_info: v[0],
    issue_description: v[1],
    service: v[2],
    status: v[3],
    appointment_date: day(i === 0 ? 1 : 0, 9 + i),
    created_at: created,
    updated_at: created,
  }));
  const parts = [
    {
      id: "part-ssd",
      name: "SSD NVMe 512GB",
      category: "Ổ cứng SSD",
      price: 890000,
      warranty_period: "36 tháng",
      is_available: true,
    },
    {
      id: "part-ram",
      name: "RAM DDR4 8GB 3200MHz",
      category: "Bộ nhớ RAM",
      price: 490000,
      warranty_period: "36 tháng",
      is_available: true,
    },
    {
      id: "part-paste",
      name: "Keo tản nhiệt hiệu năng cao",
      category: "Bảo dưỡng",
      price: 100000,
      warranty_period: "Theo dịch vụ",
      is_available: true,
    },
    {
      id: "part-kbd",
      name: "Bàn phím laptop tương thích",
      category: "Bàn phím",
      price: 450000,
      warranty_period: "6 tháng",
      is_available: false,
    },
  ];
  const tickets = [
    {
      id: "demo-ticket-2",
      code: "SC-DEMO0002",
      appointment_id: "demo-appointment-2",
      technician_id: "demo-tech",
      status: "diagnosing",
      notes: "Đang mở máy kiểm tra chân cắm M.2",
      intake_notes: "Máy có trầy xước nhẹ ở mặt đáy, kèm sạc zin theo máy.",
      serial_number: "DELL-INSP-2024-001",
      total_price: 1090000,
      quote_items: [
        {
          part_id: "part-ssd",
          item_name: "SSD NVMe 512GB",
          quantity: 1,
          unit_price: 890000,
        },
        {
          part_id: null,
          item_name: "Công lắp đặt và cài đặt lại hệ điều hành",
          quantity: 1,
          unit_price: 200000,
        },
      ],
      created_at: created,
      updated_at: created,
    },
    {
      id: "demo-ticket-4",
      code: "SC-DEMO0004",
      appointment_id: "demo-appointment-4",
      technician_id: "demo-tech-2",
      status: "repairing",
      notes: "Đã vệ sinh khe RAM, đang kiểm tra sức khỏe ổ cứng.",
      intake_notes: "Bản lề hơi lỏng, có dán decal nắp lưng.",
      serial_number: "LNV-TP-E14-9981",
      total_price: 0,
      quote_items: [],
      created_at: created,
      updated_at: created,
    },
    {
      id: "demo-ticket-5",
      code: "SC-DEMO0005",
      appointment_id: "demo-appointment-5",
      technician_id: "demo-tech",
      status: "completed",
      notes: "Đã cài đặt hoàn tất Windows và các ứng dụng văn phòng.",
      intake_notes: "Không kèm sạc, máy còn 65% pin.",
      serial_number: "HP-PAV-15-7723",
      total_price: 100000,
      quote_items: [
        {
          part_id: null,
          item_name: "Gói cài đặt hệ điều hành và phần mềm cơ bản",
          quantity: 1,
          unit_price: 100000,
        },
      ],
      created_at: created,
      updated_at: created,
    },
  ];
  const events = [
    {
      id: "demo-event-1",
      appointment_id: "demo-appointment-2",
      actor_id: "demo-manager",
      actor_name: "Quản lý cửa hàng",
      message: "Tiếp nhận thiết bị tại cửa hàng, kiểm tra ngoại quan.",
      created_at: created,
    },
    {
      id: "demo-event-2",
      appointment_id: "demo-appointment-2",
      actor_id: "demo-manager",
      actor_name: "Quản lý cửa hàng",
      message: "Phân công công việc cho kỹ thuật viên Trần Hoàng Nam.",
      created_at: created,
    },
    {
      id: "demo-event-3",
      appointment_id: "demo-appointment-2",
      actor_id: "demo-tech",
      actor_name: "Trần Hoàng Nam",
      message: "Bắt đầu kiểm tra chi tiết thiết bị.",
      created_at: created,
    },
    {
      id: "demo-event-4",
      appointment_id: "demo-appointment-2",
      actor_id: "demo-tech",
      actor_name: "Trần Hoàng Nam",
      message: "Lập báo giá dịch vụ: 1.090.000 ₫.",
      created_at: created,
    },
  ];
  return { profiles, appointments, tickets, parts, events };
}
