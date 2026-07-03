import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = "yakout-private";
const APARTMENT_MEDIA_BUCKET = "yakout-media";
const APARTMENT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const APARTMENT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFolderForType(documentType: string, relatedType?: string): string {
  const folderMap: Record<string, string> = {
    client_doc: "clients",
    owner_contract: "owners",
    property_doc: "apartments",
    vehicle_doc: "vehicles",
    payment_receipt: "payments",
    expense_receipt: "expenses",
    invoice: "payments",
    internal: "internal",
  };
  if (relatedType && ["client", "owner", "apartment", "vehicle", "payment", "expense"].includes(relatedType)) {
    const map: Record<string, string> = {
      client: "clients", owner: "owners", apartment: "apartments",
      vehicle: "vehicles", payment: "payments", expense: "expenses",
    };
    return map[relatedType] ?? "general";
  }
  return folderMap[documentType] ?? "general";
}

function getExtension(mimeType: string, fileName: string): string {
  const extMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "text/plain": "txt",
  };
  if (extMap[mimeType]) return extMap[mimeType];
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
}

function generateFilePath(
  companyId: string,
  documentType: string,
  fileName: string,
  mimeType: string,
  relatedType?: string,
): string {
  const folder = getFolderForType(documentType, relatedType);
  const ext = getExtension(mimeType, fileName);
  const baseName = slugify(fileName.replace(/\.[^.]+$/, "")) || "document";
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  return `documents/${companyId}/${folder}/${timestamp}-${random}-${baseName}.${ext}`;
}

export async function uploadDocument(
  file: File,
  companyId: string,
  documentType: string,
  relatedType?: string,
): Promise<{ filePath: string; fileUrl: string; fileName: string; fileSize: number; mimeType: string; extension: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);
  const extension = getExtension(file.type, file.name);
  const filePath = generateFilePath(companyId, documentType, file.name, file.type, relatedType);

  const admin = createSupabaseAdminClient();

  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.id === BUCKET)) {
    const { error: bucketError } = await admin.storage.createBucket(BUCKET, { public: false });
    if (bucketError) throw new Error(`Erreur creation bucket: ${bucketError.message}`);
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(filePath, buffer, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) throw new Error(`Erreur upload: ${uploadError.message}`);

  return {
    filePath,
    fileUrl: filePath,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    extension,
  };
}

export async function getDocumentSignedUrl(
  filePath: string,
  expiresIn = 600,
): Promise<string | null> {
  if (!filePath) return null;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(filePath, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteDocumentFile(filePath: string): Promise<void> {
  if (!filePath) return;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([filePath]);
  if (error) throw new Error(`Erreur suppression fichier: ${error.message}`);
}

export async function uploadApartmentImage(
  file: File,
  apartmentId: string,
): Promise<{ filePath: string; publicUrl: string; fileName: string; fileSize: number; mimeType: string; extension: string }> {
  if (!APARTMENT_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format invalide. Utilisez JPG, PNG ou WebP.");
  }
  if (file.size > APARTMENT_IMAGE_MAX_SIZE) {
    throw new Error("Image trop lourde. Taille maximum : 5 MB.");
  }

  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);
  const extension = getExtension(file.type, file.name);
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
  const filePath = `apartments/${apartmentId}/${crypto.randomUUID()}-${baseName}.${extension}`;

  const admin = createSupabaseAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((b) => b.id === APARTMENT_MEDIA_BUCKET)) {
    const { error: bucketError } = await admin.storage.createBucket(APARTMENT_MEDIA_BUCKET, { public: true });
    if (bucketError) throw new Error(`Erreur creation bucket media: ${bucketError.message}`);
  }

  const { error: uploadError } = await admin.storage.from(APARTMENT_MEDIA_BUCKET).upload(filePath, buffer, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) throw new Error(`Erreur upload photo: ${uploadError.message}`);

  const { data } = admin.storage.from(APARTMENT_MEDIA_BUCKET).getPublicUrl(filePath);
  return {
    filePath,
    publicUrl: data.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    extension,
  };
}

export async function deleteApartmentImageFile(filePath: string): Promise<void> {
  if (!filePath) return;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage.from(APARTMENT_MEDIA_BUCKET).remove([filePath]);
  if (error) throw new Error(`Erreur suppression photo: ${error.message}`);
}

export { BUCKET as DOCUMENTS_BUCKET };
export { APARTMENT_MEDIA_BUCKET };
