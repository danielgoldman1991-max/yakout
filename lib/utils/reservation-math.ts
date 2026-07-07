export function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function calculateReservationPrices(input: {
  nightlyRate: number;
  nights: number;
  cleaningFee?: number;
  touristTax?: number;
  servicesTotal?: number;
  discountAmount?: number;
}): {
  accommodationSubtotal: number;
  cleaningFee: number;
  touristTax: number;
  servicesTotal: number;
  discountAmount: number;
  totalAmount: number;
} {
  const accommodationSubtotal = Math.round(input.nightlyRate * input.nights * 100) / 100;
  const cleaningFee = input.cleaningFee ?? 0;
  const touristTax = input.touristTax ?? 0;
  const servicesTotal = input.servicesTotal ?? 0;
  const discountAmount = input.discountAmount ?? 0;
  const totalAmount = Math.max(0, accommodationSubtotal + cleaningFee + touristTax + servicesTotal - discountAmount);
  return { accommodationSubtotal, cleaningFee, touristTax, servicesTotal, discountAmount, totalAmount };
}
