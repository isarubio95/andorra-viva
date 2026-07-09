import { supabase } from '@/lib/supabase';
import { BUSINESS_IMAGE_MIME_TYPES } from '@/lib/business-image-upload';

const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, '');

export function getR2PublicUrl(key: string): string {
  const normalizedKey = key.replace(/^\//, '');
  if (!r2PublicUrl) {
    throw new Error('Falta VITE_R2_PUBLIC_URL en la configuración.');
  }
  return `${r2PublicUrl}/${normalizedKey}`;
}

function resolveContentType(file: File): string {
  if (file.type && BUSINESS_IMAGE_MIME_TYPES.includes(file.type as (typeof BUSINESS_IMAGE_MIME_TYPES)[number])) {
    return file.type;
  }
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

function buildObjectKey(userId: string, file: File, namePrefix = ''): string {
  const ext = file.name.split('.').pop() || 'jpg';
  const randomPart = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${userId}/${namePrefix}${randomPart}.${ext}`;
}

export async function uploadBusinessImage(
  userId: string,
  file: File,
  options?: { namePrefix?: string },
): Promise<{ url?: string; error?: string }> {
  if (!userId) return { error: 'Usuario no autenticado' };
  if (!r2PublicUrl) return { error: 'Almacenamiento R2 no configurado' };

  const key = buildObjectKey(userId, file, options?.namePrefix);
  const contentType = resolveContentType(file);

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { error: 'Usuario no autenticado' };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
  const presignRes = await fetch(`${supabaseUrl}/functions/v1/r2-upload-url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ key, contentType }),
  });

  if (!presignRes.ok) {
    const errBody = (await presignRes.json().catch(() => null)) as { error?: string } | null;
    return { error: errBody?.error ?? `Error al preparar la subida (${presignRes.status})` };
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => '');
    console.error('R2 upload failed:', uploadRes.status, detail);
    return { error: `Error al subir la imagen (${uploadRes.status})` };
  }

  return { url: publicUrl || getR2PublicUrl(key) };
}
