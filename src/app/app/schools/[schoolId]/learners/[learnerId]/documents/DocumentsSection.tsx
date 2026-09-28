import { supabaseAdmin } from "@/lib/supabase/server";
import { uploadLearnerDocumentAction, getDocumentDownloadUrlAction } from "./actions";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DownloadButton } from "./DownloadButton";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function DocumentsSection({ schoolId, learnerId }: { schoolId: string; learnerId: string }) {
  const { data: documents } = await supabaseAdmin()
    .from("learner_documents")
    .select("id, file_name, content_type, size_bytes, created_at")
    .eq("school_id", schoolId)
    .eq("learner_id", learnerId)
    .order("created_at", { ascending: false });

  const boundUpload = uploadLearnerDocumentAction.bind(null, schoolId, learnerId);

  return (
    <div>
      <h3 className="text-lg font-semibold">Documents</h3>
      {!documents?.length ? (
        <p className="mt-3 text-sm text-white/50">No documents uploaded yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3">
              <div>
                <p className="text-sm text-white/80">{doc.file_name}</p>
                <p className="text-xs text-white/40">
                  {formatSize(doc.size_bytes)} · {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <DownloadButton action={getDocumentDownloadUrlAction.bind(null, schoolId, learnerId, doc.id)} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <DocumentUploadForm action={boundUpload} />
        <p className="mt-2 text-xs text-white/30">PDF, JPEG, PNG, or WebP — 10MB maximum.</p>
      </div>
    </div>
  );
}
