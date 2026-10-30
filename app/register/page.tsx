"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Register() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?mode=register");
  }, [router]);
  return <p className="container page-space">Đang mở biểu mẫu đăng ký…</p>;
}
