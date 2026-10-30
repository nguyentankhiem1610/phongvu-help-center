"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Fan,
  Wrench,
  Cpu,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { services } from "@/views/presenters/catalog";
import { money } from "@/views/presenters/format";
const icons = [Fan, Wrench, Cpu, ShieldCheck];
export default function Services() {
  return (
    <Suspense fallback={<p className="container page-space">Đang tải dịch vụ…</p>}>
      <ServicesQuery />
    </Suspense>
  );
}
function ServicesQuery() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  return <ServicesContent key={query} initialQuery={query} />;
}
function ServicesContent({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const list = services.filter((s) =>
    `${s.name} ${s.description}`
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi")),
  );
  return (
    <div className="container page-space">
      <div className="page-heading">
        <span className="overline">CHĂM SÓC TOÀN DIỆN</span>
        <h1>Dịch vụ cho laptop của bạn</h1>
        <p>
          Từ bảo dưỡng định kỳ đến nâng cấp hiệu năng, lựa chọn phù hợp với nhu
          cầu.
        </p>
      </div>
      <div className="search-field service-search">
        <Search size={18} />
        <input
          aria-label="Tìm trong dịch vụ"
          placeholder="Tìm dịch vụ…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="services-detail-grid">
        {list.map((s) => {
          const index = services.indexOf(s),
            Icon = icons[index];
          return (
            <article className="panel service-detail" key={s.id}>
              <div className={`service-visual visual-${index}`}>
                <Icon size={56} strokeWidth={1.2} />
              </div>
              <h2>{s.name}</h2>
              <p>{s.description}</p>
              <ul>
                {(s.id === "cleaning"
                  ? [
                      "Vệ sinh quạt, khe tản nhiệt và bề mặt máy",
                      "Kiểm tra nhiệt độ và thay keo phù hợp",
                      "Kiểm tra hoạt động sau bảo dưỡng",
                    ]
                  : s.id === "repair"
                    ? [
                        "Ghi nhận triệu chứng và chẩn đoán lỗi",
                        "Tra cứu linh kiện tương thích",
                        "Lập báo giá, cập nhật từng bước xử lý",
                      ]
                    : s.id === "upgrade"
                      ? [
                          "Kiểm tra cấu hình và khả năng tương thích",
                          "Tư vấn RAM, SSD theo nhu cầu sử dụng",
                          "Lắp đặt và kiểm tra độ ổn định",
                        ]
                      : [
                          "Tiếp nhận yêu cầu cài đặt",
                          "Sử dụng giấy phép hợp lệ do khách cung cấp",
                          "Kiểm tra chức năng sau khi cài đặt",
                        ]
                ).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <div className="service-detail-bottom">
                <strong>
                  {s.price ? `Từ ${money(s.price)}` : "Báo giá sau chẩn đoán"}
                </strong>
                <Link className="button" href={`/booking?service=${s.id}`}>
                  Đặt lịch <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && (
        <div className="panel empty">
          Không tìm thấy dịch vụ. Thử từ khóa “vệ sinh”, “sửa chữa” hoặc “SSD”.
        </div>
      )}
      <p className="price-note">
        Mức giá minh họa phục vụ đồ án. Báo giá thực tế của từng phiếu được lưu
        sau khi kiểm tra máy.
      </p>
    </div>
  );
}
