export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_min: number;
  price_text: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type AppointmentStatus = "pending" | "confirmed" | "done" | "cancelled";

export type Appointment = {
  id: string;
  service_id: string;
  scheduled_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  status: AppointmentStatus;
  customer_confirmation_token: string;
  reminder_sent_at: string | null;
  customer_confirmed_at: string | null;
  created_at: string;
};

export type AdminAccessRequestStatus = "pending" | "approved" | "rejected";

export type AdminAccessRequest = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: AdminAccessRequestStatus;
  requested_at: string;
  reviewed_at: string | null;
  reviewer_note: string | null;
};
