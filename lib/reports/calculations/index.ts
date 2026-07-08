export function computeMargin(revenue: number, cost: number): number {
  return revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
}

export function computeOccupancyRate(occupiedNights: number, availableNights: number): number {
  return availableNights > 0 ? (occupiedNights / availableNights) * 100 : 0;
}

export function computeADR(revenue: number, occupiedNights: number): number {
  return occupiedNights > 0 ? revenue / occupiedNights : 0;
}

export function computeRevPAR(revenue: number, availableNights: number): number {
  return availableNights > 0 ? revenue / availableNights : 0;
}

export function computeAvgStay(occupiedNights: number, reservationCount: number): number {
  return reservationCount > 0 ? occupiedNights / reservationCount : 0;
}

export function computeConversionRate(converted: number, total: number): number {
  return total > 0 ? (converted / total) * 100 : 0;
}

export function computeNetRevenue(revenue: number, expenses: number, commission: number): number {
  return revenue - expenses - commission;
}

export function computeCommission(revenue: number, rate: number): number {
  return revenue * rate;
}

export function computeGrowth(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function bookingsToCash(confirmedPayments: number, totalReserved: number): number {
  return totalReserved > 0 ? (confirmedPayments / totalReserved) * 100 : 0;
}
