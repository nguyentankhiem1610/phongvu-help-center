export type Role = "customer" | "technician" | "manager";

export type TechnicianStatus = "draft" | "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  email?: string;
  username?: string;
  technician_status?: TechnicianStatus;
  address?: string;
};

export type TechnicianApplication = {
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  specialization: string;
  experience_years: number;
  introduction: string;
  status: TechnicianStatus;
  review_note: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  service_location?: "store" | "home";
  service_address?: string;
  visit_notes?: string;
  id: string;
  code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  device_info: string;
  issue_description: string;
  service: string;
  appointment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  created_at?: string | null;
  line_total?: number;
  part_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
};

export type RepairTicket = {
  manager_id?: string | null;
  id: string;
  code: string;
  appointment_id: string;
  technician_id: string | null;
  status: string;
  notes: string;
  intake_notes: string;
  serial_number: string;
  total_price: number;
  quote_items: QuoteItem[];
  created_at: string;
  updated_at: string;
};

export type TicketEvent = {
  ticket_id?: string | null;
  status?: string | null;
  id: string;
  appointment_id: string;
  actor_id: string | null;
  actor_name: string;
  message: string;
  created_at: string;
};

export type Part = {
  id: string;
  name: string;
  category: string;
  price: number;
  warranty_period: string;
  is_available: boolean;
};

export type Database = {
  profiles: Profile[];
  appointments: Appointment[];
  tickets: RepairTicket[];
  parts: Part[];
  events: TicketEvent[];
  technician_applications?: TechnicianApplication[];
};

export type Snapshot = Database & {
  auth_provider?: "application" | "supabase";
  user: Profile | null;
  mode: "frontend" | "supabase";
};
