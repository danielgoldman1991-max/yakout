export type Status = "new" | "Nouveau" | "A qualifier" | "Contacte" | "Devis envoye" | "Confirme" | "Perdu" | "A relancer";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  request_type: string;
  district?: string;
  source: string;
  page_url?: string;
  related_type?: "apartment" | "vehicle";
  related_slug?: string;
  status: Status;
  client_id?: string;
  converted_at?: string;
  message?: string;
  desired_date?: string;
  people_count?: number;
  estimated_budget?: number;
  created_at: string;
};

export type Client = {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  nationality?: string;
  country?: string;
  city?: string;
  preferred_language?: string;
  client_type?: string;
  status?: string;
  tags?: string[];
  acquisition_source?: string;
  source?: string;
  notes?: string;
  preferences?: string | Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type Apartment = {
  id: string;
  internal_name: string;
  public_name: string;
  slug: string;
  district: string;
  bedrooms: number;
  bathrooms?: number;
  capacity: number;
  price_from: number;
  short_description?: string;
  detailed_description?: string;
  amenities?: string[];
  is_published: boolean;
  is_featured: boolean;
  image_url?: string;
  image_alt_text?: string;
  meta_title?: string;
  meta_description?: string;
};

export type Vehicle = {
  id: string;
  internal_name: string;
  public_name: string;
  slug: string;
  brand: string;
  model: string;
  capacity: number;
  price_from: number;
  with_driver: boolean;
  is_published: boolean;
  is_featured?: boolean;
  public_description?: string;
  image_url?: string;
  image_alt_text?: string;
  meta_title?: string;
  meta_description?: string;
};

export type Reservation = {
  id: string;
  client_id?: string;
  client_name?: string;
  apartment_id?: string;
  apartment_name?: string;
  check_in: string;
  check_out: string;
  people_count?: number;
  total_amount: number;
  deposit_amount: number;
  reservation_status: string;
};

export type Trip = {
  id: string;
  client_id?: string;
  vehicle_id?: string;
  client_name?: string;
  vehicle_name?: string;
  trip_date: string;
  trip_time?: string;
  departure: string;
  destination: string;
  sold_price: number;
  cost_price: number;
  status: string;
  trip_status?: string;
};

export type Payment = {
  id: string;
  client_id?: string;
  reservation_id?: string;
  trip_id?: string;
  client_name?: string;
  amount: number;
  paid_at: string;
  payment_method: string;
  activity_type: string;
  status: string;
};

export type Expense = {
  id: string;
  amount: number;
  expense_date: string;
  category: string;
  activity_type: string;
};

export type Partner = {
  id: string;
  name: string;
  type: string;
  phone?: string;
  email?: string;
  commission?: number;
  is_active: boolean;
};
