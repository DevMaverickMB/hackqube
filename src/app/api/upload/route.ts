import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse, errorResponse } from "@/lib/auth-utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const BUCKET = "attachments";
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "text/plain",
  "text/csv",
  "application/zip",
]);

let bucketChecked = false;
async function ensureBucket() {
  if (bucketChecked) return;
  const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (!error && data) {
    bucketChecked = true;
    return;
  }
  // Create the bucket if it does not exist.
  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
  });
  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Failed to create storage bucket "${BUCKET}": ${createError.message}`);
  }
  bucketChecked = true;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return errorResponse("No file provided", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return errorResponse("File size must be under 10 MB", 400);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return errorResponse("File type not allowed", 400);
  }

  const ext = file.name.split(".").pop() || "bin";
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 100);
  const path = `presentations/${user.id}/${Date.now()}_${sanitizedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await ensureBucket();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Storage bucket unavailable";
    console.error(message);
    return errorResponse(message, 500);
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return errorResponse(`Upload failed: ${error.message}`, 500);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path);

  return NextResponse.json({
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  });
}
