import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error(JSON.stringify({ ok: false, error: "Variables Supabase serveur absentes. Audit non exécuté." }, null, 2)); process.exitCode = 2; }
else {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const checks = [];
  async function check(name, table, columns, evaluate) {
    const { data, error } = await db.from(table).select(columns);
    if (error) { checks.push({ name, status: "unavailable", error: { code: error.code, message: error.message } }); return; }
    const anomalies = evaluate(data ?? []); checks.push({ name, status: anomalies.length ? "failed" : "passed", count: anomalies.length, sample: anomalies.slice(0, 20) });
  }
  await check("published_apartments_completeness", "apartments", "id,slug,public_name,property_type,city,capacity,bedrooms,bathrooms,price_per_night,price_from,image_url,public_status,is_published", (rows) => rows.filter((row) => (row.public_status === "published" || row.is_published) && (!row.public_name || !row.slug || !row.property_type || !row.city || !row.capacity || !row.image_url)));
  await check("invalid_reservation_dates", "reservations", "id,apartment_id,client_id,check_in,check_out,reservation_status", (rows) => rows.filter((row) => !row.apartment_id || !row.client_id || !row.check_in || !row.check_out || row.check_out <= row.check_in));
  await check("reservation_conflicts", "reservations", "id,apartment_id,check_in,check_out,reservation_status", (rows) => rows.flatMap((row, index) => rows.slice(index + 1).filter((other) => row.apartment_id && row.apartment_id === other.apartment_id && row.check_in < other.check_out && row.check_out > other.check_in && !["cancelled", "Annulée"].includes(row.reservation_status) && !["cancelled", "Annulée"].includes(other.reservation_status)).map((other) => ({ first: row.id, second: other.id, apartment_id: row.apartment_id }))));
  await check("payment_consistency", "payments", "id,reservation_id,apartment_id,client_id,status,paid_at,amount,currency", (rows) => rows.filter((row) => !row.amount || Number(row.amount) < 0 || (row.status === "paid" && !row.paid_at) || (row.status === "pending" && row.paid_at)));
  await check("orphan_documents", "documents", "id,owner_id,apartment_id,reservation_id,payment_id,expense_id,vehicle_id,partner_id,related_type,related_id", (rows) => rows.filter((row) => !row.owner_id && !row.apartment_id && !row.reservation_id && !row.payment_id && !row.expense_id && !row.vehicle_id && !row.partner_id && !row.related_id));
  const failed = checks.filter((item) => item.status === "failed").length; const unavailable = checks.filter((item) => item.status === "unavailable").length;
  console.log(JSON.stringify({ ok: failed === 0 && unavailable === 0, generatedAt: new Date().toISOString(), failed, unavailable, checks }, null, 2));
  if (failed || unavailable) process.exitCode = 1;
}
