import { Schema, model, models } from "mongoose";

const studentPromoterApplicationSchema = new Schema({
  applicationNumber: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  whatsapp: { type: String, required: true, unique: true, index: true, trim: true, maxlength: 40 },
  department: { type: String, required: true, trim: true, maxlength: 160 },
  level: { type: String, required: true, trim: true, maxlength: 40 },
  university: { type: String, default: "University of Nigeria, Nsukka (UNN)" },
  programme: { type: String, default: "UNN Student Marketer & Campus Promoter" },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"], default: "PENDING", index: true },
  assignedReferralCode: { type: String, default: null, index: true },
  standardCommissionRate: { type: Number, default: 15 },
  performanceCommissionRate: { type: Number, default: 20 },
  performanceThreshold: { type: Number, default: 10 },
  agreedToTerms: { type: Boolean, required: true, default: false },
  source: { type: String, default: "WEBSITE_RECRUITMENT_PAGE" },
  approvedAt: { type: Date, default: null },
}, { timestamps: true });

const promoterPayoutSchema = new Schema({
  payoutNumber: { type: String, required: true, unique: true, index: true },
  applicationNumber: { type: String, required: true, index: true },
  referralCode: { type: String, required: true, index: true },
  orderNumbers: [{ type: String, required: true }],
  externalReferences: [{ type: String, required: true }],
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "NGN" },
  commissionRate: { type: Number, required: true, min: 0, max: 100 },
  status: { type: String, enum: ["PAID", "VOID"], default: "PAID", index: true },
  paidAt: { type: Date, default: Date.now },
  note: { type: String, default: null, maxlength: 500 },
}, { timestamps: true });

promoterPayoutSchema.index({ orderNumbers: 1 }, { unique: true, sparse: true });

const promoterReferralEventSchema = new Schema({
  referralCode: { type: String, required: true, index: true, maxlength: 64 },
  product: { type: String, enum: ["ACADEMIC", "FINTIGEN", "DDEI"], required: true, index: true },
  eventType: { type: String, enum: ["CLICK", "LEAD", "PURCHASE"], default: "CLICK", index: true },
  sessionId: { type: String, required: true, maxlength: 160, index: true },
  externalReference: { type: String, default: null, maxlength: 160, index: true },
  page: { type: String, default: null, maxlength: 300 },
  sourceHost: { type: String, default: null, maxlength: 160 },
  label: { type: String, default: null, maxlength: 240 },
  value: { type: Number, default: null, min: 0 },
  currency: { type: String, default: "NGN", maxlength: 8 },
  paidAt: { type: Date, default: null },
  payoutNumber: { type: String, default: null, index: true, maxlength: 80 },
}, { timestamps: true });

promoterReferralEventSchema.index(
  { referralCode: 1, product: 1, eventType: 1, sessionId: 1 },
  { unique: true },
);
promoterReferralEventSchema.index(
  { product: 1, externalReference: 1 },
  { unique: true, sparse: true },
);

export const StudentPromoterApplication =
  models.MabrigStudentPromoterApplication ||
  model("MabrigStudentPromoterApplication", studentPromoterApplicationSchema);

export const PromoterPayout =
  models.MabrigPromoterPayout ||
  model("MabrigPromoterPayout", promoterPayoutSchema);

export const PromoterReferralEvent =
  models.MabrigPromoterReferralEvent ||
  model("MabrigPromoterReferralEvent", promoterReferralEventSchema);
