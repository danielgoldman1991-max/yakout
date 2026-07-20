import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises côté serveur.");
  process.exit(2);
}
const supabase = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });
const [{data:reservations,error:reservationError},{data:payments,error:paymentError}] = await Promise.all([
  supabase.from("reservations").select("id,total_amount,deposit_amount,remaining_amount,payment_status,company_id"),
  supabase.from("payments").select("id,reservation_id,amount,currency,status,payment_type,company_id,created_at"),
]);
if (reservationError || paymentError) {
  console.error({ reservationError, paymentError });
  process.exit(1);
}
const paid = new Set(["paid","paye","payé","completed","encaissé","encaisse"]);
const refunded = new Set(["refunded","remboursé","rembourse"]);
let differences = 0;
for (const reservation of reservations ?? []) {
  const linked = (payments ?? []).filter(payment => payment.reservation_id === reservation.id && payment.company_id === reservation.company_id);
  const gross = linked.filter(payment => paid.has(String(payment.status).toLowerCase())).reduce((sum,payment)=>sum+Number(payment.amount),0);
  const refunds = linked.filter(payment => refunded.has(String(payment.status).toLowerCase()) || payment.payment_type === "refund").reduce((sum,payment)=>sum+Number(payment.amount),0);
  const net = gross-refunds, balance = Math.max(Number(reservation.total_amount)-net,0);
  const status = refunds>0&&net<=0?"refunded":net>Number(reservation.total_amount)?"overpaid":net===Number(reservation.total_amount)&&net>0?"paid":net>0?"partially_paid":"unpaid";
  const differs = Number(reservation.deposit_amount)!==net || Number(reservation.remaining_amount)!==balance || ![status, status==="partially_paid"?"Partiel":"", status==="paid"?"Paye":"", status==="unpaid"?"Non paye":""].includes(String(reservation.payment_status));
  if (differs) { differences++; console.log(JSON.stringify({reservationId:reservation.id,total:Number(reservation.total_amount),calculatedPaid:net,storedPaid:Number(reservation.deposit_amount),calculatedBalance:balance,storedBalance:Number(reservation.remaining_amount),calculatedStatus:status,storedStatus:reservation.payment_status,paymentCount:linked.length})); }
}
const orphans = (payments ?? []).filter(payment => !payment.reservation_id);
console.log(JSON.stringify({mode:apply?"apply":"dry-run",reservations:(reservations??[]).length,differences,unlinkedPayments:orphans.length}));
if (apply) {
  console.error("Mode apply refusé : le schéma actuel utilise des colonnes générées depuis deposit_amount. Appliquez d’abord la migration transactionnelle validée ; aucun paiement fictif ni acompte n’a été créé.");
  process.exit(3);
}
