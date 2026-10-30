"use client";
import Link from "next/link";
import Image from "next/image";
import {
  Fan,
  Wrench,
  Cpu,
  ShieldCheck,
  ArrowRight,
  CalendarDays,
  Search,
  CheckCircle2,
  Clock3,
  ChevronRight,
  MapPin,
  NotebookPen,
  ClipboardCheck,
  PackageCheck,
} from "lucide-react";
import { useApp } from "@/views/components/app-provider";
import { services } from "@/views/presenters/catalog";
import { money } from "@/views/presenters/format";
const icons = [Fan, Wrench, Cpu, ShieldCheck];
export default function Home() {
  const { data } = useApp();
  return (
    <div className="container home">
      <div className="breadcrumbs">
        Trang chủ <ChevronRight size={12} />
        <span>Trung tâm dịch vụ</span>
      </div>
      <section className="hero-grid">
        <aside className="service-menu">
          <h3>
            <Wrench size={17} /> DỊCH VỤ LAPTOP
          </h3>
          {services.map((s, i) => {
            const Icon = icons[i];
            return (
              <Link key={s.id} href={`/booking?service=${s.id}`}>
                <Icon size={18} />
                <span>{s.name}</span>
                <ChevronRight size={14} />
              </Link>
            );
          })}
          <div className="sidebar-help">
            <ShieldCheck size={28} />
            <strong>
              Thiết bị của bạn.
              <br />
              Sự tận tâm của chúng tôi.
            </strong>
            <p>
              Kiểm tra rõ ràng.
              <br />
              Báo giá minh bạch.
            </p>
            <Link href="/services">
              Khám phá dịch vụ <ArrowRight size={14} />
            </Link>
          </div>
        </aside>
        <div className="hero">
          <div className="hero-copy">
            <span className="eyebrow">PHONG VŨ HELP CENTER</span>
            <h1>
              Laptop khỏe.
              <br />
              Công việc <em>mượt mà.</em>
            </h1>
            <p>
              Đặt lịch sửa chữa và bảo trì laptop.
              <br />
              Chủ động thời gian, an tâm theo dõi.
            </p>
            <Link href="/booking" className="button white">
              Đặt lịch ngay <ArrowRight size={17} />
            </Link>
            <div className="hero-small">
              <CheckCircle2 size={14} /> Đăng ký trước · Tiếp nhận thuận tiện
            </div>
          </div>
          <Image
            className="hero-art"
            src="/laptop-care.svg"
            width={700}
            height={480}
            alt="Laptop được kiểm tra và bảo dưỡng, sẵn sàng hoạt động"
          />
          <div className="hero-bottom">
            <span>
              01 <i>/ 01</i>
            </span>
            <span>DỊCH VỤ CHĂM SÓC LAPTOP</span>
            <span className="hero-dots">● ━</span>
          </div>
        </div>
        <aside className="hero-aside">
          <div className="quick-track">
            <Search size={27} />
            <h3>
              Máy của bạn
              <br />
              đang đến đâu?
            </h3>
            <p>
              Theo dõi từng bước xử lý
              <br />
              ngay trên tài khoản.
            </p>
            <Link href="/track">
              Tra cứu tiến độ <ArrowRight size={16} />
            </Link>
          </div>
          <div className="store-mini">
            <MapPin size={21} />
            <strong>Một điểm tiếp nhận</strong>
            <p>
              132E Cách Mạng Tháng Tám
              <br />
              TP. Hồ Chí Minh
            </p>
            <span>
              <i /> 08:00 – 20:00 mỗi ngày
            </span>
          </div>
        </aside>
      </section>
      <section className="trust-strip">
        <div>
          <CalendarDays />
          <span>
            <strong>Đặt lịch trực tuyến</strong>
            <small>Chọn thời gian phù hợp</small>
          </span>
        </div>
        <div>
          <ClipboardCheck />
          <span>
            <strong>Báo giá minh bạch</strong>
            <small>Hạng mục và chi phí rõ ràng</small>
          </span>
        </div>
        <div>
          <Clock3 />
          <span>
            <strong>Theo dõi chủ động</strong>
            <small>Cập nhật trong tài khoản</small>
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>Chăm sóc tận tâm</strong>
            <small>Từ tiếp nhận đến bàn giao</small>
          </span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="overline">GIẢI PHÁP CHO THIẾT BỊ CỦA BẠN</span>
            <h2>Bạn cần hỗ trợ điều gì?</h2>
          </div>
          <Link href="/services">
            Tất cả dịch vụ <ArrowRight size={16} />
          </Link>
        </div>
        <div className="service-cards">
          {services.map((s, i) => {
            const Icon = icons[i];
            return (
              <Link
                className="service-card"
                key={s.id}
                href={`/booking?service=${s.id}`}
              >
                <div className={`service-visual visual-${i}`}>
                  <Icon size={52} strokeWidth={1.3} />
                  <span>0{i + 1}</span>
                </div>
                <div className="service-card-body">
                  <h3>{s.name}</h3>
                  <p>{s.description}</p>
                  <div>
                    <strong>
                      {s.price ? <>Từ {money(s.price)}</> : "Theo chẩn đoán"}
                    </strong>
                    <span className="round-arrow">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="price-note">
          Chi phí minh họa cho đồ án. Báo giá cụ thể được ghi nhận sau khi kiểm
          tra thiết bị.
        </p>
      </section>
      <section className="process-section">
        <div className="section-heading">
          <div>
            <span className="overline">ĐƠN GIẢN TỪ BƯỚC ĐẦU TIÊN</span>
            <h2>4 bước, an tâm trọn hành trình</h2>
          </div>
          <span className="soft-text">
            Chủ động theo dõi trên một tài khoản
          </span>
        </div>
        <div className="process-grid">
          {[
            [
              CalendarDays,
              "Đặt lịch hẹn",
              "Chọn dịch vụ và khung giờ mang máy đến.",
            ],
            [
              NotebookPen,
              "Tiếp nhận & kiểm tra",
              "Ghi nhận tình trạng, phân công kỹ thuật viên.",
            ],
            [
              Wrench,
              "Sửa chữa & cập nhật",
              "Theo dõi tiến độ và xem báo giá chi tiết.",
            ],
            [
              PackageCheck,
              "Hoàn tất & bàn giao",
              "Nhận lại thiết bị và xem lịch sử dịch vụ.",
            ],
          ].map(([Icon, title, desc], i) => {
            const I = Icon as typeof CalendarDays;
            return (
              <div className="process" key={i}>
                <span className="process-no">0{i + 1}</span>
                <I size={26} />
                <h3>{String(title)}</h3>
                <p>{String(desc)}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="bottom-cta">
        <div>
          <span>LAPTOP CẦN CHĂM SÓC?</span>
          <h2>Để Phong Vũ đồng hành cùng bạn.</h2>
          <p>Bắt đầu bằng một lịch hẹn phù hợp với thời gian của bạn.</p>
        </div>
        <Link className="button" href={data.user ? "/booking" : "/login"}>
          Đặt lịch sửa chữa <ArrowRight size={17} />
        </Link>
      </section>
    </div>
  );
}
