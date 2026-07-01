import { supabase } from "./supabase";
import { handleSupabaseError } from "./errors";
import { compressImage } from "@/shared/lib/compressImage";

export type BucketName = "project-files" | "mostruario" | "quote-pdfs";

export interface UploadOptions {
  bucket: BucketName;
  path: string;
  file: File | Blob;
  compress?: boolean;
  contentType?: string;
  upsert?: boolean;
}

export const storageService = {
  async upload({ bucket, path, file, compress = false, contentType, upsert = true }: UploadOptions): Promise<string> {
    let payload: File | Blob = file;
    if (compress && file instanceof File && file.type.startsWith("image/")) {
      payload = await compressImage(file);
    }
    const { error } = await supabase.storage.from(bucket).upload(path, payload, {
      contentType: contentType ?? (file instanceof File ? file.type : undefined),
      upsert,
    });
    if (error) throw handleSupabaseError(error, `enviar arquivo para ${bucket}`);
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async remove(bucket: BucketName, paths: string[]): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw handleSupabaseError(error, `remover arquivo de ${bucket}`);
  },

  publicUrl(bucket: BucketName, path: string): string {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },
};
