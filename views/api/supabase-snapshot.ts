import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Role, Snapshot, TechnicianStatus } from "@/types/entities";
import { authError, loadProfile } from "./auth-actions";

type Row = Record<string, unknown>;
const text = (row: Row, key: string) => row[key] == null ? "" : String(row[key]);
const lower = (row: Row, key: string) => text(row, key).toLowerCase();
export function emptySnapshot(): Snapshot {
  return { user: null, mode: "supabase", auth_provider: "supabase", profiles: [],
    appointments: [], tickets: [], parts: [], events: [], technician_applications: [] };
}

export async function loadSupabaseSnapshot(client: SupabaseClient): Promise<Snapshot> {
  const auth = await client.auth.getUser();
  if (auth.error?.name === "AuthSessionMissingError") return emptySnapshot();
  if (auth.error) throw authError(auth.error);
  if (!auth.data.user) return emptySnapshot();
  const user = await loadProfile(client, auth.data.user);
  // Tat ca truy van dung JWT cua nguoi dang nhap; RLS gioi han du lieu o DB.
  const results = await Promise.all([
    client.from("users").select("id,full_name,email,phone_number,address,role"),
    client.from("appointments").select("*"),
    client.from("repair_orders").select("*"),
    client.from("repair_order_details").select("*"),
    client.from("components").select("*"),
    client.from("service_events").select("*").order("created_at"),
    client.from("services").select("id,code"),
    client.from("technician_applications").select("*"),
  ]);
  for (const result of results) {
    if (result.error) throw new Error(`Không đọc được dữ liệu Supabase: ${result.error.message}. Kiểm tra setup.sql và RLS.`);
  }
  const [profiles, appointments, orders, details, components, events, services, applications] = results.map(r => (r.data || []) as Row[]);
  const mappedProfiles: Profile[] = profiles.map(row => ({
    id: text(row,"id"), full_name: text(row,"full_name"), email: text(row,"email"),
    phone: text(row,"phone_number"), address: text(row,"address"), role: lower(row,"role") as Role,
  }));
  const mappedApplications = applications.map(row => {
    const profile = mappedProfiles.find(p => p.id === row.user_id);
    return {
      user_id: text(row,"user_id"), full_name: profile?.full_name || "", phone: profile?.phone || "",
      email: profile?.email, specialization: text(row,"specialization"), experience_years: Number(row.experience_years),
      introduction: text(row,"introduction"), status: lower(row,"status") as TechnicianStatus,
      review_note: text(row,"review_note"), submitted_at: text(row,"submitted_at") || null,
      reviewed_at: text(row,"reviewed_at") || null, reviewed_by: text(row,"reviewed_by") || null,
      created_at: text(row,"submitted_at"), updated_at: text(row,"updated_at"),
    };
  });
  const application = mappedApplications.find(a => a.user_id === user.id);
  if (application) user.technician_status = application.status;
  return {
    ...emptySnapshot(), user, profiles: mappedProfiles, technician_applications: mappedApplications,
    appointments: appointments.map(row => ({
      id: text(row,"id"), code: text(row,"code"), customer_id: text(row,"customer_id"),
      customer_name: text(row,"customer_name"), customer_phone: text(row,"phone_number"),
      device_info: text(row,"laptop_model"), issue_description: text(row,"issue_description"),
      service: text(services.find(s => s.id === row.service_id) || {},"code"),
      appointment_date: text(row,"scheduled_time"), status: lower(row,"status"),
      service_location: text(row,"service_location") === "home" ? "home" : "store",
      service_address: text(row,"service_address"), visit_notes: text(row,"visit_notes"),
      created_at: text(row,"created_at"), updated_at: text(row,"updated_at"),
    })),
    tickets: orders.filter(row => row.appointment_id).map(row => ({
      id: text(row,"id"), code: text(row,"code"), appointment_id: text(row,"appointment_id"),
      technician_id: text(row,"technician_id") || null, manager_id: text(row,"received_by") || null,
      status: lower(row,"status"), notes: "", intake_notes: text(row,"initial_condition"),
      serial_number: text(row,"serial_number"), total_price: Number(row.total_amount),
      created_at: text(row,"received_at"), updated_at: text(row,"updated_at"),
      quote_items: details.filter(d => d.repair_order_id === row.id).map(d => ({
        part_id: text(d,"component_id") || null, item_name: text(d,"item_name"),
        quantity: Number(d.quantity), unit_price: Number(d.price), line_total: Number(d.line_total),
        created_at: text(d,"created_at"),
      })),
    })),
    parts: components.map(row => ({
      id: text(row,"id"), name: text(row,"name"), category: text(row,"category"),
      price: Number(row.unit_price), warranty_period: `${Number(row.warranty_months)} tháng`, is_available: Boolean(row.is_active),
    })),
    events: events.map(row => ({
      id: text(row,"id"), appointment_id: text(row,"appointment_id"), ticket_id: text(row,"repair_order_id") || null,
      actor_id: text(row,"actor_id") || null, actor_name: text(row,"actor_name"),
      status: lower(row,"new_status") || null, message: text(row,"message"), created_at: text(row,"created_at"),
    })),
  };
}
