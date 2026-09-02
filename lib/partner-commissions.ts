export const COMMISSION_FULFILLED_STATUSES = new Set(["READY", "COLLECTED", "DELIVERED"]);

export type CommissionLine = {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  amountPaid: number;
  commissionRate: number;
  commissionAmount: number;
  eligible: boolean;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

export function isEligibleCommissionOrder(orderValue: unknown, paymentValue?: unknown) {
  const order = record(orderValue);
  const payment = record(paymentValue);
  return Boolean(
    order.referralCode &&
    payment.status === "PAID" &&
    COMMISSION_FULFILLED_STATUSES.has(String(order.status || "").toUpperCase()) &&
    Number(payment.amount || 0) > 0
  );
}

export function commissionForOrder(
  orderValue: unknown,
  paymentValue: unknown,
  commissionRate: number,
): CommissionLine {
  const order = record(orderValue);
  const payment = record(paymentValue);
  const eligible = isEligibleCommissionOrder(order, payment);
  const amountPaid = Number(payment.amount || 0);
  const safeRate = Math.max(0, Math.min(100, Number(commissionRate || 0)));
  return {
    orderId: String(order._id || ""),
    orderNumber: String(order.orderNumber || ""),
    orderStatus: String(order.status || "NEW"),
    paymentStatus: String(payment.status || "UNPAID"),
    amountPaid,
    commissionRate: safeRate,
    commissionAmount: eligible ? Math.round((amountPaid * safeRate / 100) * 100) / 100 : 0,
    eligible,
  };
}

export function startOfCalendarMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfCalendarMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function previousCalendarMonth(date = new Date()) {
  return {
    start: new Date(date.getFullYear(), date.getMonth() - 1, 1),
    end: new Date(date.getFullYear(), date.getMonth(), 1),
  };
}
