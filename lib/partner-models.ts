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

export const StudentPromoterApplication =
  models.MabrigStudentPromoterApplication ||
  model("MabrigStudentPromoterApplication", studentPromoterApplicationSchema);
