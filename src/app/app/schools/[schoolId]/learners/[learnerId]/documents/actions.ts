"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "admission-documents";
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface UploadDocumentState {
  message?: string;
}

export async function uploadLearnerDocumentAction(
  schoolId: string,
  learnerId: string,
  _prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  const { user } = await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "Choose a file to upload." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { message: "Only PDF, JPEG, PNG, or WebP files are allowed." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { message: "File is too large — 10MB maximum." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const storagePath = `${schoolId}/${learnerId}/${Date.now()}-${safeName}`;

  const admin = supabaseAdmin();
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("[uploadLearnerDocumentAction] storage upload failed:", uploadError);
    return { message: "Something went wrong uploading the file. Please try again." };
  }

  const { error: insertError } = await admin.from("learner_documents").insert({
    school_id: schoolId,
    learner_id: learnerId,
    file_name: file.name,
    storage_path: storagePath,
    content_type: file.type,
    size_bytes: file.size,
    uploaded_by: user.id,
  });

  if (insertError) {
    console.error("[uploadLearnerDocumentAction] metadata insert failed:", insertError);
    await admin.storage.from(BUCKET).remove([storagePath]);
    return { message: "Something went wrong saving the document record. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/learners/${learnerId}`);
  return {};
}

export interface DownloadLinkResult {
  url?: string;
  message?: string;
}

export async function getDocumentDownloadUrlAction(
  schoolId: string,
  learnerId: string,
  documentId: string
): Promise<DownloadLinkResult> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const admin = supabaseAdmin();
  const { data: doc } = await admin
    .from("learner_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("school_id", schoolId)
    .eq("learner_id", learnerId)
    .maybeSingle();

  if (!doc) {
    return { message: "Document not found." };
  }

  // 60-second signed URL — never a stable/public link. A fresh one is
  // minted per click, so nothing long-lived ever reaches the browser.
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60);

  if (error || !data) {
    console.error("[getDocumentDownloadUrlAction] createSignedUrl failed:", error);
    return { message: "Something went wrong generating the download link." };
  }

  return { url: data.signedUrl };
}
