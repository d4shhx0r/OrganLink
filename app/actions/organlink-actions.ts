"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import {
  donorSchema,
  recipientSchema,
  organSchema,
  approvalSchema,
  organStatusSchema,
  profileUpdateSchema,
} from "@/lib/validations/entities";
import type { AppRole } from "@/lib/types/organlink";

// Helper: Authenticate and retrieve caller with profile role
async function getAuthenticatedUserWithRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Please log in to perform this action.");
  }

  // Fetch verified profile role from database (never trust client)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const role: AppRole = (profile?.role as AppRole) || "donor";

  return { supabase, user, role, profile };
}

// Generate unique healthcare reference code
function generateReference(prefix: "DON" | "REC" | "ORG"): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
}

// ============================================================================
// 1. DONOR ACTIONS
// ============================================================================

export async function createDonorAction(rawData: unknown) {
  const { supabase, user, role } = await getAuthenticatedUserWithRole();

  // Validate
  const parseResult = donorSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const validData = parseResult.data;
  const donorRef = generateReference("DON");

  // Determine profile association and approval status
  // Donor users can only create their own record in 'pending' state
  const isPrivileged = role === "admin" || role === "hospital";
  const profileId = isPrivileged ? (user.id) : user.id;

  const newDonorRecord = {
    profile_id: profileId,
    donor_reference: donorRef,
    full_name: validData.full_name,
    date_of_birth: validData.date_of_birth,
    gender: validData.gender,
    blood_group: validData.blood_group,
    tissue_type: validData.tissue_type,
    location: validData.location,
    contact_information: validData.contact_information,
    medical_status: validData.medical_status,
    consent_status: validData.consent_status,
    approval_status: "pending",
  };

  const { data, error } = await supabase
    .from("donors")
    .insert([newDonorRecord])
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to register donor record." };
  }

  // Cryptographic Audit Log
  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: role,
    action: "DONOR_CREATED",
    entityType: "donor",
    entityId: data.id,
    newState: data,
    metadata: { reference: donorRef },
  });

  revalidatePath("/app/donors");
  revalidatePath("/app/dashboard");

  return { success: true, donorId: data.id, reference: donorRef };
}

export async function reviewDonorApprovalAction(rawData: unknown) {
  const { supabase, user, role } = await getAuthenticatedUserWithRole();

  // Authorization check: Only Admin or Hospital can approve/reject donors
  if (role !== "admin" && role !== "hospital") {
    return {
      success: false,
      error: "Forbidden: Only authorized hospital and administrative personnel can review donor applications.",
    };
  }

  const parseResult = approvalSchema.safeParse(rawData);
  if (!parseResult.success) {
    return { success: false, error: "Invalid approval payload." };
  }

  const { donorId, decision, notes } = parseResult.data;

  // Retrieve previous state for audit integrity
  const { data: previousDonor, error: fetchErr } = await supabase
    .from("donors")
    .select("*")
    .eq("id", donorId)
    .single();

  if (fetchErr || !previousDonor) {
    return { success: false, error: "Donor record not found." };
  }

  const updatedFields = {
    approval_status: decision,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  };

  const { data: updatedDonor, error: updateErr } = await supabase
    .from("donors")
    .update(updatedFields)
    .eq("id", donorId)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: "Failed to update donor approval status." };
  }

  // Cryptographic Audit Log
  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: role,
    action: decision === "approved" ? "DONOR_APPROVED" : "DONOR_REJECTED",
    entityType: "donor",
    entityId: donorId,
    previousState: previousDonor,
    newState: updatedDonor,
    metadata: { decision, notes: notes || null, reviewer: user.email },
  });

  revalidatePath(`/app/donors/${donorId}`);
  revalidatePath("/app/donors");
  revalidatePath("/app/dashboard");

  return { success: true, donor: updatedDonor };
}

// ============================================================================
// 2. RECIPIENT ACTIONS
// ============================================================================

export async function createRecipientAction(rawData: unknown) {
  const { supabase, user, role } = await getAuthenticatedUserWithRole();

  const parseResult = recipientSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const validData = parseResult.data;
  const recipientRef = generateReference("REC");

  const newRecipientRecord = {
    profile_id: user.id,
    recipient_reference: recipientRef,
    full_name: validData.full_name,
    date_of_birth: validData.date_of_birth,
    gender: validData.gender,
    blood_group: validData.blood_group,
    tissue_type: validData.tissue_type,
    required_organ: validData.required_organ,
    location: validData.location,
    medical_urgency: validData.medical_urgency,
    status: "active",
  };

  const { data, error } = await supabase
    .from("recipients")
    .insert([newRecipientRecord])
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to register recipient record." };
  }

  // Cryptographic Audit Log
  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: role,
    action: "RECIPIENT_CREATED",
    entityType: "recipient",
    entityId: data.id,
    newState: data,
    metadata: { reference: recipientRef, organ: validData.required_organ },
  });

  revalidatePath("/app/recipients");
  revalidatePath("/app/dashboard");

  return { success: true, recipientId: data.id, reference: recipientRef };
}

// ============================================================================
// 3. ORGAN ACTIONS
// ============================================================================

export async function registerOrganAction(rawData: unknown) {
  const { supabase, user, role } = await getAuthenticatedUserWithRole();

  // Authorization: Only Hospital and Admin can register organs
  if (role !== "admin" && role !== "hospital") {
    return {
      success: false,
      error: "Forbidden: Only authorized clinical personnel can register available organs.",
    };
  }

  const parseResult = organSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const validData = parseResult.data;

  // Workflow integrity from research paper: Donor must exist AND have approved status!
  const { data: donorRecord, error: donorErr } = await supabase
    .from("donors")
    .select("id, approval_status, full_name, donor_reference")
    .eq("id", validData.donor_id)
    .single();

  if (donorErr || !donorRecord) {
    return { success: false, error: "Associated donor record not found." };
  }

  if (donorRecord.approval_status !== "approved") {
    return {
      success: false,
      error: "Workflow constraint: Organ availability can only be registered for approved donors.",
    };
  }

  const organRef = generateReference("ORG");

  const newOrganRecord = {
    organ_reference: organRef,
    organ_type: validData.organ_type,
    donor_id: validData.donor_id,
    blood_group: validData.blood_group,
    tissue_type: validData.tissue_type,
    location: validData.location,
    availability_status: "available",
    available_at: validData.available_at,
    expiry_at: validData.expiry_at || null,
  };

  const { data, error } = await supabase
    .from("organs")
    .insert([newOrganRecord])
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to register organ." };
  }

  // Cryptographic Audit Log
  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: role,
    action: "ORGAN_REGISTERED",
    entityType: "organ",
    entityId: data.id,
    newState: data,
    metadata: {
      organReference: organRef,
      donorReference: donorRecord.donor_reference,
      type: validData.organ_type,
    },
  });

  revalidatePath("/app/organs");
  revalidatePath("/app/dashboard");

  return { success: true, organId: data.id, reference: organRef };
}

export async function updateOrganStatusAction(rawData: unknown) {
  const { supabase, user, role } = await getAuthenticatedUserWithRole();

  if (role !== "admin" && role !== "hospital") {
    return {
      success: false,
      error: "Forbidden: Only authorized personnel can update organ availability status.",
    };
  }

  const parseResult = organStatusSchema.safeParse(rawData);
  if (!parseResult.success) {
    return { success: false, error: "Invalid status update payload." };
  }

  const { organId, status, notes } = parseResult.data;

  const { data: previousOrgan, error: fetchErr } = await supabase
    .from("organs")
    .select("*")
    .eq("id", organId)
    .single();

  if (fetchErr || !previousOrgan) {
    return { success: false, error: "Organ record not found." };
  }

  const { data: updatedOrgan, error: updateErr } = await supabase
    .from("organs")
    .update({ availability_status: status })
    .eq("id", organId)
    .select()
    .single();

  if (updateErr) {
    return { success: false, error: "Failed to update organ availability status." };
  }

  // Cryptographic Audit Log
  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: role,
    action: "ORGAN_STATUS_CHANGED",
    entityType: "organ",
    entityId: organId,
    previousState: previousOrgan,
    newState: updatedOrgan,
    metadata: { newStatus: status, notes: notes || null },
  });

  revalidatePath(`/app/organs/${organId}`);
  revalidatePath("/app/organs");
  revalidatePath("/app/dashboard");

  return { success: true, organ: updatedOrgan };
}

// ============================================================================
// 4. PROFILE ACTION
// ============================================================================

export async function updateProfileAction(rawData: unknown) {
  const { supabase, user, role } = await getAuthenticatedUserWithRole();

  const parseResult = profileUpdateSchema.safeParse(rawData);
  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors.map((e) => e.message).join(", "),
    };
  }

  const validData = parseResult.data;

  // Crucial security: NEVER allow updating 'role' from this action!
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      full_name: validData.full_name,
      phone: validData.phone || null,
      blood_group: validData.blood_group || null,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Failed to update profile." };
  }

  await recordAuditEvent({
    actorUserId: user.id,
    actorRole: role,
    action: "PROFILE_UPDATED",
    entityType: "profile",
    entityId: user.id,
    newState: updatedProfile,
  });

  revalidatePath("/app/profile");
  revalidatePath("/app/dashboard");

  return { success: true, profile: updatedProfile };
}
