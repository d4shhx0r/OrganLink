export type AppRole = "admin" | "hospital" | "donor" | "recipient";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export const BLOOD_GROUPS: BloodGroup[] = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

export type OrganType = "kidney" | "liver" | "heart" | "lung" | "cornea";

export const ORGAN_TYPES: { value: OrganType; label: string; maxIschemiaHours: number }[] = [
  { value: "kidney", label: "Kidney (Renal)", maxIschemiaHours: 36 },
  { value: "liver", label: "Liver (Hepatic)", maxIschemiaHours: 12 },
  { value: "heart", label: "Heart (Cardiac)", maxIschemiaHours: 4 },
  { value: "lung", label: "Lung (Pulmonary)", maxIschemiaHours: 6 },
  { value: "cornea", label: "Cornea (Ocular)", maxIschemiaHours: 336 },
];

export type DonorApprovalStatus = "pending" | "approved" | "rejected";
export type DonorConsentStatus = "pending" | "provided" | "withdrawn";
export type DonorMedicalStatus = "pending_review" | "eligible_for_review" | "not_currently_eligible";

export type MedicalUrgency = "status_1_critical" | "status_2_urgent" | "routine";
export type RecipientStatus = "active" | "matched" | "transplanted" | "suspended" | "inactive";

export type OrganAvailabilityStatus = "available" | "reserved" | "allocated" | "transplanted" | "unavailable";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  avatar_url: string | null;
  phone?: string | null;
  blood_group?: string | null;
  hospital_id?: string | null;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  profile_id?: string | null;
  donor_reference: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: BloodGroup;
  tissue_type: string;
  location: string;
  contact_information?: string | null;
  medical_status: DonorMedicalStatus;
  consent_status: DonorConsentStatus;
  approval_status: DonorApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipient {
  id: string;
  profile_id?: string | null;
  recipient_reference: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: BloodGroup;
  tissue_type: string;
  required_organ: OrganType;
  location: string;
  medical_urgency: MedicalUrgency;
  waiting_since: string;
  status: RecipientStatus;
  created_at: string;
  updated_at: string;
}

export interface Organ {
  id: string;
  organ_reference: string;
  organ_type: OrganType;
  donor_id: string;
  blood_group: BloodGroup;
  tissue_type: string;
  location: string;
  availability_status: OrganAvailabilityStatus;
  available_at: string;
  expiry_at?: string | null;
  created_at: string;
  updated_at: string;
  donor?: Donor | null;
}
