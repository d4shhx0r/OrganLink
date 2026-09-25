import { z } from "zod";

const bloodGroupEnum = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const organTypeEnum = z.enum(["kidney", "liver", "heart", "lung", "cornea"]);

// Donor validation schema
export const donorSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters." })
    .max(100, { message: "Full name cannot exceed 100 characters." }),
  date_of_birth: z
    .string()
    .min(1, { message: "Date of birth is required." })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  gender: z
    .string()
    .trim()
    .min(1, { message: "Gender selection is required." }),
  blood_group: bloodGroupEnum,
  tissue_type: z
    .string()
    .trim()
    .min(3, { message: "Tissue type (HLA) is required for matching." })
    .max(120, { message: "Tissue typing string too long." }),
  location: z
    .string()
    .trim()
    .min(2, { message: "Location/Facility is required." }),
  contact_information: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),
  medical_status: z
    .enum(["pending_review", "eligible_for_review", "not_currently_eligible"])
    .default("pending_review"),
  consent_status: z
    .enum(["pending", "provided", "withdrawn"])
    .default("provided"),
});

export type DonorFormData = z.infer<typeof donorSchema>;

// Recipient validation schema
export const recipientSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Patient name must be at least 2 characters." })
    .max(100),
  date_of_birth: z
    .string()
    .min(1, { message: "Date of birth is required." })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format." }),
  gender: z
    .string()
    .trim()
    .min(1, { message: "Gender is required." }),
  blood_group: bloodGroupEnum,
  tissue_type: z
    .string()
    .trim()
    .min(3, { message: "Tissue typing (HLA) is required." }),
  required_organ: organTypeEnum,
  location: z
    .string()
    .trim()
    .min(2, { message: "Treatment center / location is required." }),
  medical_urgency: z
    .enum(["status_1_critical", "status_2_urgent", "routine"])
    .default("routine"),
});

export type RecipientFormData = z.infer<typeof recipientSchema>;

// Organ validation schema
export const organSchema = z.object({
  organ_type: organTypeEnum,
  donor_id: z
    .string()
    .uuid({ message: "Valid approved donor ID must be selected." }),
  blood_group: bloodGroupEnum,
  tissue_type: z
    .string()
    .trim()
    .min(3, { message: "Tissue type must be provided." }),
  location: z
    .string()
    .trim()
    .min(2, { message: "Preservation location is required." }),
  available_at: z
    .string()
    .min(1, { message: "Harvest/procurement timestamp is required." })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid timestamp." }),
  expiry_at: z
    .string()
    .optional()
    .nullable(),
});

export type OrganFormData = z.infer<typeof organSchema>;

// Approval action schema
export const approvalSchema = z.object({
  donorId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().trim().max(500).optional(),
});

export type ApprovalFormData = z.infer<typeof approvalSchema>;

// Organ status update schema
export const organStatusSchema = z.object({
  organId: z.string().uuid(),
  status: z.enum(["available", "reserved", "allocated", "transplanted", "unavailable"]),
  notes: z.string().trim().max(500).optional(),
});

export type OrganStatusFormData = z.infer<typeof organStatusSchema>;

// Profile update schema
export const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters."),
  phone: z.string().trim().max(30).optional().nullable(),
  blood_group: z.string().trim().max(5).optional().nullable(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
