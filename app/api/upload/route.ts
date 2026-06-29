import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createSupabaseActionClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

const BUCKET = "yakout-media";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["apartments", "vehicles", "blog", "services", "pages", "site"]);
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_ROLES = new Set(["admin", "manager", "staff"]);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = String(formData.get("folder") ?? "site");

  if (!file) return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
  if (!ALLOWED_FOLDERS.has(folder)) return NextResponse.json({ error: "Dossier Storage invalide." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Format invalide. Utilisez JPG, PNG ou WebP." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Image trop lourde. Taille maximum : 5 MB." }, { status: 400 });

  if (!hasSupabaseEnv()) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name}`;
    await writeFile(join(uploadDir, fileName), buffer);
    logger.info("Fichier uploade (mode demo)", { fileName });
    return NextResponse.json({ ok: true, url: `/uploads/${fileName}` });
  }

  const supabase = await createSupabaseActionClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Connexion requise pour uploader une image." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile || !ALLOWED_ROLES.has(profile.role)) {
    logger.warn("Upload refused: profile role missing or unauthorized", {
      user_id: user.id,
      email: user.email,
      role: profile?.role,
      error: profileError?.message,
    });
    return NextResponse.json({ error: "Vous n'avez pas le droit d'uploader une image." }, { status: 403 });
  }

  const bytes = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `${folder}/${Date.now()}-${baseName}.${extension}`;
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.id === BUCKET)) {
    const { error: bucketError } = await admin.storage.createBucket(BUCKET, { public: true });
    if (bucketError) {
      logger.error("Storage bucket creation failed", bucketError);
      return NextResponse.json({ error: bucketError.message }, { status: 500 });
    }
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    logger.error("Storage upload failed", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path });
}
