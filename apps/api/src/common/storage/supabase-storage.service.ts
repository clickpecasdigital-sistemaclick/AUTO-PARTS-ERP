import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  path: string;
  publicUrl: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('supabase.url') || process.env.SUPABASE_URL;
    const key = this.configService.get<string>('supabase.serviceRoleKey') || process.env.SUPABASE_SERVICE_KEY;

    if (url && key) {
      this.client = createClient(url, key);
    } else {
      console.warn('[SupabaseStorage] Credenciais não configuradas — storage desabilitado');
    }
  }

  async upload(bucket: string, path: string, file: Buffer, contentType: string): Promise<UploadResult> {
    if (!this.client) return { path, publicUrl: '' };
    const { error } = await this.client.storage.from(bucket).upload(path, file, { contentType, upsert: false });
    if (error) throw new InternalServerErrorException(`Upload falhou: ${error.message}`);
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  async delete(bucket: string, path: string): Promise<void> {
    if (!this.client) return;
    await this.client.storage.from(bucket).remove([path]);
  }

  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    if (!this.client) return '';
    const { data, error } = await this.client.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error) throw new InternalServerErrorException(error.message);
    return data.signedUrl;
  }
}
